'use strict';

const https = require('node:https');
const axios = require('axios');
const logger = require('../config/logger');
const { BACKBONE_BASE_URL, SESSION_HEADER, AUTHORIZATION } = require('../config/constants');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function buildHeaders(req, url, { sessionHeader = false, ...extra } = {}) {
  const sessionToken = req.headers[SESSION_HEADER];
  const { host } = new URL(url);
  return {
    Accept: 'application/json',
    host,
    ...(sessionToken ? { [AUTHORIZATION]: `Bearer ${sessionToken}` } : {}),
    ...(sessionToken && sessionHeader ? { [SESSION_HEADER]: sessionToken } : {}),
    ...extra,
  };
}

function sendBinary(res, response) {
  const contentType = response.headers['content-type'];
  const disposition = response.headers['content-disposition'];
  if (contentType) res.setHeader('Content-Type', contentType);
  if (disposition) res.setHeader('Content-Disposition', disposition);
  res.status(response.status).send(Buffer.from(response.data));
}

/**
 * Forward a request to backbone-rest and pipe the response back.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {string} backendPath  Path relative to backbone-rest base (e.g. '/api/v1/users')
 * @param {object} [overrides]  Axios config overrides. `responseType: 'arraybuffer'` streams the
 *                              upstream body back untouched (used for images / documents);
 *                              `sessionHeader: true` also forwards the raw session-token header.
 */
async function proxyToBackbone(req, res, backendPath, overrides = {}) {
  const url = `${BACKBONE_BASE_URL}${backendPath}`;
  const { sessionHeader, ...axiosOverrides } = overrides;

  try {
    const response = await axios({
      method: req.method,
      url,
      headers: buildHeaders(req, url, { 'Content-Type': 'application/json', sessionHeader }),
      params: req.query,
      data: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
      validateStatus: () => true,
      httpsAgent,
      ...axiosOverrides,
    });

    const warning = response.headers['warning'];
    if (warning) res.setHeader('Warning', warning);

    if (axiosOverrides.responseType === 'arraybuffer') {
      sendBinary(res, response);
    } else {
      res.status(response.status).json(response.data);
    }
  } catch (err) {
    logger.error(`Proxy error → ${url}: ${err.code ?? ''} ${err.message}`.trim());
    res.status(502).json({ error: 'Backend unavailable' });
  }
}

/**
 * Forward a multipart/form-data request (parsed by multer into req.files / req.body) to
 * backbone-rest.
 * @param {object} [options]
 * @param {string[]} [options.jsonFields]      body fields sent as application/json parts
 * @param {boolean}  [options.binaryResponse]  stream the upstream body back untouched
 * @param {Record<number, number>} [options.statusMap]  rewrite upstream status codes
 * @param {boolean}  [options.sessionHeader]   also forward the raw session-token header
 */
async function proxyMultipart(req, res, backendPath, options = {}) {
  const { jsonFields = [], binaryResponse = false, statusMap = {}, sessionHeader = false } = options;
  const url = `${BACKBONE_BASE_URL}${backendPath}`;

  const form = new FormData();
  for (const [key, value] of Object.entries(req.body ?? {})) {
    if (jsonFields.includes(key)) {
      form.append(key, new Blob([String(value)], { type: 'application/json' }));
    } else {
      form.append(key, String(value));
    }
  }
  for (const file of req.files ?? (req.file ? [req.file] : [])) {
    form.append(file.fieldname, new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  }

  try {
    const response = await axios({
      method: req.method,
      url,
      headers: buildHeaders(req, url, { sessionHeader }),
      params: req.query,
      data: form,
      validateStatus: () => true,
      httpsAgent,
      ...(binaryResponse ? { responseType: 'arraybuffer' } : {}),
    });

    const status = statusMap[response.status] ?? response.status;
    if (binaryResponse) {
      sendBinary(res, { ...response, status });
    } else {
      res.status(status).json(response.data);
    }
  } catch (err) {
    logger.error(`Proxy error → ${url}: ${err.code ?? ''} ${err.message}`.trim());
    res.status(502).json({ error: 'Backend unavailable' });
  }
}

module.exports = { proxyToBackbone, proxyMultipart };
