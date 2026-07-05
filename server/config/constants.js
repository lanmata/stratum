'use strict';

module.exports = {
  BACKBONE_BASE_URL: process.env['BACKBONE_BASE_URL'] || 'http://localhost:8443',
  SESSION_HEADER: 'session-token',
  AUTHORIZATION: 'Authorization',
  PORT: parseInt(process.env['PORT'] || '4000', 10),
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  CORS_ORIGIN: process.env['CORS_ORIGIN'] || '*',
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX: 200,
  REDIS_URL: process.env['REDIS_URL'] || 'redis://localhost:6379',
};
