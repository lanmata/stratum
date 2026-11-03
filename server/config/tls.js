'use strict';

const https = require('node:https');
const { readFileSync } = require('node:fs');

/**
 * Builds the HTTPS agent the BFF uses to call backbone-rest.
 *
 * - `caPath` set: the certificate of backbone is verified against that CA (the PEM may hold several certificates) and
 *   against `servername` when given.
 * - `insecure` set: verification is off on purpose, and logged.
 * - neither: verification is off as in earlier versions, and a warning says how to turn it on. This keeps an existing
 *   deployment working until its CA is mounted.
 *
 * @param {object} options
 * @param {string} [options.caPath]
 * @param {string} [options.servername]
 * @param {boolean} [options.insecure]
 * @param {object} [deps]  injectable for tests
 * @returns {{ agent: https.Agent, verified: boolean }}
 */
function buildHttpsAgent({ caPath = '', servername = '', insecure = false } = {}, deps = {}) {
  const { readFile = readFileSync, logger = require('./logger') } = deps;

  if (caPath && !insecure) {
    const agent = new https.Agent({
      ca: readFile(caPath),
      rejectUnauthorized: true,
      ...(servername ? { servername } : {}),
    });
    return { agent, verified: true };
  }

  if (insecure) {
    logger.warn('BACKBONE_TLS_INSECURE=true: the certificate of backbone-rest is NOT verified.');
  } else {
    logger.warn(
      'The certificate of backbone-rest is NOT verified. Set BACKBONE_CA_PATH to the CA that signed it ' +
        '(and BACKBONE_TLS_SERVERNAME if you reach it through another name).'
    );
  }
  return { agent: new https.Agent({ rejectUnauthorized: false }), verified: false };
}

module.exports = { buildHttpsAgent };
