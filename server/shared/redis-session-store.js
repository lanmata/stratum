'use strict';

const { createClient } = require('redis');
const logger = require('../config/logger');
const { REDIS_URL } = require('../config/constants');

let redisClient = null;

const CONNECT_TIMEOUT_MS = 5000;

async function connectRedis() {
  let ready = false;
  const client = createClient({
    url: REDIS_URL,
    socket: {
      connectTimeout: CONNECT_TIMEOUT_MS,
      reconnectStrategy: (retries) => (ready ? Math.min(retries * 500, 5000) : false),
    },
  });
  client.on('ready', () => {
    ready = true;
  });
  client.on('error', (err) => logger.warn(`Redis client error: ${err.message}`));
  try {
    await Promise.race([
      client.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('connection timed out')), CONNECT_TIMEOUT_MS)
      ),
    ]);
    redisClient = client;
    logger.info('Redis connected');
    return redisClient;
  } catch (err) {
    logger.warn(`Redis unavailable (${err.message}), using in-memory session store`);
    client.destroy();
    return null;
  }
}

async function getClient() {
  if (!redisClient) await connectRedis();
  return redisClient;
}

module.exports = { connectRedis, getClient };
