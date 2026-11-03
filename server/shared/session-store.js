'use strict';

const crypto = require('node:crypto');

/**
 * Server-side session store: session id → the real session and refresh tokens.
 * Uses Redis when `getRedis` returns a client and falls back to memory (one instance only) when it does not or when Redis fails.
 * @param {object} [options]
 * @param {() => Promise<object|null>} [options.getRedis]
 * @param {() => number} [options.now]
 */
function createSessionStore({ getRedis = async () => null, now = Date.now } = {}) {
  const memory = new Map();
  const key = (id) => `stratum:sess:${id}`;

  async function redis() {
    try {
      return await getRedis();
    } catch {
      return null;
    }
  }

  async function put(id, tokens, ttlSeconds) {
    const client = await redis();
    if (client) {
      try {
        await client.set(key(id), JSON.stringify(tokens), { EX: ttlSeconds });
        return id;
      } catch {
        /* falls back to memory */
      }
    }
    memory.set(id, { tokens, expiresAt: now() + ttlSeconds * 1000 });
    return id;
  }

  async function create(tokens, ttlSeconds) {
    return put(crypto.randomBytes(32).toString('base64url'), tokens, ttlSeconds);
  }

  async function get(id) {
    if (!id || id.length > 128) return null;
    const client = await redis();
    if (client) {
      try {
        const raw = await client.get(key(id));
        if (raw) return JSON.parse(raw);
      } catch {
        /* falls back to memory */
      }
    }
    const entry = memory.get(id);
    if (!entry) return null;
    if (entry.expiresAt <= now()) {
      memory.delete(id);
      return null;
    }
    return entry.tokens;
  }

  async function remove(id) {
    memory.delete(id);
    const client = await redis();
    if (client) {
      try {
        await client.del(key(id));
      } catch {
        /* nothing to do */
      }
    }
  }

  return { create, put, get, remove };
}

module.exports = { createSessionStore };
