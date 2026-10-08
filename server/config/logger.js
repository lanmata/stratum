'use strict';

const { createLogger, format, transports } = require('winston');
const { NODE_ENV, LOG_LEVEL } = require('./constants');

const logger = createLogger({
  level: LOG_LEVEL,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    NODE_ENV === 'production' ? format.json() : format.simple()
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
