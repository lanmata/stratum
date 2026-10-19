'use strict';

const path = require('node:path');

const sslDir = path.join(__dirname, '../../ssl');

// Number of reverse-proxy hops to trust for X-Forwarded-* (0/unset = none, i.e. direct access).
function parseTrustProxy(value) {
  if (!value || value === 'false') return false;
  if (value === 'true') return true;
  return /^\d+$/.test(value) ? parseInt(value, 10) : value;
}

module.exports = {
  BACKBONE_BASE_URL: process.env['BACKBONE_BASE_URL'] || 'http://localhost:8443',
  SESSION_HEADER: 'session-token',
  AUTHORIZATION: 'Authorization',
  PORT: parseInt(process.env['PORT'] || '4000', 10),
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  TRUST_PROXY: parseTrustProxy(process.env['TRUST_PROXY']),
  LOG_LEVEL: process.env['LOG_LEVEL'] || (process.env['NODE_ENV'] === 'production' ? 'info' : 'debug'),
  CORS_ORIGIN: process.env['CORS_ORIGIN'] || '*',
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env['RATE_LIMIT_MAX'] || '1000', 10),
  REDIS_URL: process.env['REDIS_URL'] || 'redis://localhost:6379',
  SSL_CERT_PATH: process.env['SSL_CERT_PATH'] || path.join(sslDir, 'wildcard.umdc-qa.tst.crt'),
  SSL_KEY_PATH: process.env['SSL_KEY_PATH'] || path.join(sslDir, 'wildcard.umdc-qa.tst.key'),
};
