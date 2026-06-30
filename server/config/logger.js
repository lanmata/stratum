'use strict';

const { createLogger, format, transports } = require('winston');
const { NODE_ENV } = require('./constants');

const logger = createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    NODE_ENV === 'production' ? format.json() : format.simple()
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
