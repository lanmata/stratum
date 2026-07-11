'use strict';

const https = require('node:https');
const axios = require('axios');
const logger = require('../config/logger');
const { BACKBONE_BASE_URL, SESSION_HEADER, AUTHORIZATION } = require('../config/constants');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Forward a request to backbone-rest and pipe the response back.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {string} backendPath  Path relative to backbone-rest base (e.g. '/api/v1/users')
 * @param {object} [overrides]  Axios config overrides
 */
async function proxyToBackbone(req, res, backendPath, overrides = {}) {
  const url = `${BACKBONE_BASE_URL}${backendPath}`;
  const sessionToken = req.headers[SESSION_HEADER];
  const { host: backboneHost } = new URL(url);

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    host: backboneHost,
    ...(sessionToken ? { [AUTHORIZATION]: `Bearer ${sessionToken}` } : {}),
  };

  try {
    const response =  await axios({
      method: req.method,
      url,
      headers,
      params: req.query,
      data: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
      validateStatus: () => true,
      ...(httpsAgent ? { httpsAgent } : {}),
      ...overrides,
    });

    const warning = response.headers['warning'];
    if (warning) res.setHeader('Warning', warning);
    res.status(response.status).json(response.data);
  } catch (err) {
    logger.error(`Proxy error → ${url}:`, err.message);
    res.status(502).json({ error: 'Backend unavailable' });
  }
}

module.exports = { proxyToBackbone };
