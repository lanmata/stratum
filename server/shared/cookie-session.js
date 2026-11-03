'use strict';

const { SESSION_HEADER, SESSION_COOKIE, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } = require('../config/constants');
const { createSessionStore } = require('./session-store');
const { getClient } = require('./redis-session-store');

const store = createSessionStore({ getRedis: getClient });
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function parseCookies(header) {
  const cookies = {};
  for (const part of String(header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) cookies[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return cookies;
}

/** A JWT without its signature: it still shows who the person is and when it expires, but cannot be used to call anything. */
function stripSignature(jwt) {
  const [header, payload] = String(jwt ?? '').split('.');
  return header && payload ? `${header}.${payload}.` : jwt;
}

/** Seconds until the token expires (its `exp` claim), never more than `cap`; `cap` when it has none. */
function tokenTtlSeconds(jwt, cap = SESSION_MAX_AGE_SECONDS, nowMs = Date.now()) {
  try {
    const exp = JSON.parse(Buffer.from(String(jwt).split('.')[1], 'base64url').toString()).exp;
    if (typeof exp === 'number') return Math.max(1, Math.min(cap, Math.floor(exp - nowMs / 1000)));
  } catch {
    /* no readable expiry */
  }
  return cap;
}

function setSessionCookie(req, res, id, maxAge) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.append('Set-Cookie', `${SESSION_COOKIE_NAME}=${encodeURIComponent(id)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`);
}

function clearSessionCookie(res) {
  res.append('Set-Cookie', `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
}

/**
 * Loads the server-side session named by the cookie into `req.stratumSession` ({ id, tokens }) and, as CSRF protection, refuses a
 * state-changing request that carries a session cookie but not the custom `session-token` header (a cross-site page cannot add it).
 * With the feature off, or without a cookie, the request goes on untouched: sessions that still hold the full token keep working.
 */
function cookieSession({ enabled = SESSION_COOKIE, sessionStore = store, name = SESSION_COOKIE_NAME } = {}) {
  return async (req, res, next) => {
    if (!enabled) return next();
    const id = parseCookies(req.headers.cookie)[name];
    const tokens = id ? await sessionStore.get(id) : null;
    if (!tokens) return next();
    if (!SAFE_METHODS.has(req.method) && !req.headers[SESSION_HEADER]) {
      return res.status(403).json({ error: 'csrf', message: `Missing ${SESSION_HEADER} header` });
    }
    req.stratumSession = { id, tokens };
    return next();
  };
}

/** Stores the tokens of a login or refresh and returns the body the browser gets (unsigned tokens). */
async function establishSession(req, res, body, sessionStore = store) {
  if (!SESSION_COOKIE || !body || !body.token) return body;
  const ttl = tokenTtlSeconds(body.token);
  const tokens = { token: body.token, refreshToken: body.refreshToken };
  const id = req.stratumSession?.id;
  if (id) await sessionStore.put(id, tokens, ttl);
  else setSessionCookie(req, res, await sessionStore.create(tokens, ttl), ttl);
  if (id) setSessionCookie(req, res, id, ttl);
  req.stratumSession = { id: id ?? null, tokens };
  return { ...body, token: stripSignature(body.token), refreshToken: body.refreshToken ? stripSignature(body.refreshToken) : body.refreshToken };
}

async function endSession(req, res, sessionStore = store) {
  if (req.stratumSession?.id) await sessionStore.remove(req.stratumSession.id);
  clearSessionCookie(res);
}

module.exports = { cookieSession, establishSession, endSession, parseCookies, stripSignature, tokenTtlSeconds, store };
