'use strict';

const { createClient } = require('redis');
const logger = require('../config/logger');
const { REDIS_URL } = require('../config/constants');

let redisClient = null;

async function connectRedis() {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => logger.warn('Redis client error (falling back to memory):', err.message));
    await redisClient.connect();
    logger.info('Redis connected');
    return redisClient;
  } catch (err) {
    logger.warn('Redis unavailable, using in-memory session store');
    return null;
  }
}

async function getClient() {
  if (!redisClient) await connectRedis();
  return redisClient;
}

module.exports = { connectRedis, getClient };
