'use strict';

/**
 * Social sign-in for Stratum (Google, Microsoft, Apple, GitHub, Meta) through backbone-rest, the identity broker. This BFF only
 * keeps the browser side of the flow: the state cookie, the safe return path and a one-time ticket that hands the session tokens to
 * the SPA without ever putting them in a URL. See docs/15-federacion-social.md.
 */
const { Router } = require('express');
const logger = require('../config/logger');
const { callBackbone } = require('../shared/proxy');
const { createSessionStore } = require('../shared/session-store');
const { getClient } = require('../shared/redis-session-store');
const { establishSession } = require('../shared/cookie-session');
const {
  FEDERATION_ENABLED,
  FEDERATION_CALLBACK_URL,
  FEDERATION_APPLICATION_ID,
  FEDERATION_STATE_COOKIE,
} = require('../config/constants');

const PROVIDER = /^[a-z]{1,32}$/;
const STATE_MAX_AGE_SECONDS = 600;
const TICKET_TTL_SECONDS = 60;
const COMPLETE_PATH = '/auth/federation/complete';
const LOGIN_PATH = '/auth/login';
const DEFAULT_RETURN = '/dashboard';

/** Backbone's stable error codes → the short code the login page turns into a message. */
const ERROR_CODES = {
  federation_state_invalid: 'expired',
  federation_token_invalid: 'failed',
  federation_not_registered: 'not_registered',
  federation_email_not_allowed: 'not_allowed',
  federation_not_linked: 'not_linked',
  federation_not_allowed: 'not_allowed',
  federation_identity_conflict: 'conflict',
  federation_idp_unavailable: 'unavailable',
  federation_rate_limited: 'rate_limited',
  federation_session_required: 'expired',
  federation_redirect_uri_invalid: 'unavailable',
  federation_provider_not_found: 'unavailable',
  federation_client_rejected: 'unavailable',
  federation_client_required: 'unavailable',
  federation_disabled: 'unavailable',
};

// switched on but without its callback URL or application the flow cannot work: it stays off and says why, instead of failing per request
const ENABLED = FEDERATION_ENABLED && Boolean(FEDERATION_CALLBACK_URL) && Boolean(FEDERATION_APPLICATION_ID);
if (FEDERATION_ENABLED && !ENABLED) {
  logger.error('FEDERATION_ENABLED=true needs FEDERATION_CALLBACK_URL and FEDERATION_APPLICATION_ID: social sign-in stays off');
}

const tickets = createSessionStore({ getRedis: getClient });

/** `returnTo` is only honoured as a path of this site (a single leading `/`, no backslash or control characters). */
function safeReturnTo(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n\t]/.test(value)) return DEFAULT_RETURN;
  return value;
}

const errorCode = (error, status) => ERROR_CODES[error] ?? (status >= 500 ? 'unavailable' : 'failed');
const loginRedirect = (res, code) => res.redirect(302, `${LOGIN_PATH}?error=${encodeURIComponent(code)}`);

function parseCookies(header) {
  const cookies = {};
  for (const part of String(header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) cookies[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return cookies;
}

const isSecure = (req) => req.secure || req.headers['x-forwarded-proto'] === 'https';

/** Apple answers with a cross-site POST (`form_post`), so only its cookie needs `SameSite=None`. */
function sameSiteOf(provider) {
  return provider === 'apple' ? 'None' : 'Lax';
}

function setStateCookie(req, res, { state, provider, returnTo }) {
  const value = Buffer.from(JSON.stringify({ state, provider, returnTo })).toString('base64url');
  const secure = isSecure(req) || provider === 'apple';
  res.append('Set-Cookie', `${FEDERATION_STATE_COOKIE}=${value}; Path=/bff/federation; HttpOnly; SameSite=${sameSiteOf(provider)}; Max-Age=${STATE_MAX_AGE_SECONDS}${secure ? '; Secure' : ''}`);
}

function clearStateCookie(res, provider) {
  res.append('Set-Cookie', `${FEDERATION_STATE_COOKIE}=; Path=/bff/federation; HttpOnly; SameSite=${sameSiteOf(provider)}; Max-Age=0`);
}

function readStateCookie(req) {
  try {
    const raw = parseCookies(req.headers.cookie)[FEDERATION_STATE_COOKIE];
    const parsed = JSON.parse(Buffer.from(String(raw ?? ''), 'base64url').toString('utf8'));
    return typeof parsed?.state === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

const router = Router();

router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// off (404) unless the feature is on; /providers still answers so the login page can tell there is nothing to show
router.use((req, res, next) => (ENABLED || req.path === '/providers' ? next() : res.status(404).json({ error: 'Not found' })));

router.get('/providers', async (_req, res) => {
  if (!ENABLED) return res.json({ enabled: false, providers: [] });
  try {
    const r = await callBackbone({ path: `/api/v1/federation/providers?applicationId=${encodeURIComponent(FEDERATION_APPLICATION_ID)}` });
    return res.json({ enabled: true, providers: r.status === 200 && Array.isArray(r.data) ? r.data : [] });
  } catch (err) {
    logger.error(`Federation providers: ${err.message}`);
    return res.json({ enabled: true, providers: [] });
  }
});

router.get('/:provider/start', async (req, res) => {
  const { provider } = req.params;
  if (!PROVIDER.test(provider)) return loginRedirect(res, 'unavailable');
  try {
    const r = await callBackbone({
      method: 'POST',
      path: '/api/v1/federation/authorize',
      data: { applicationId: FEDERATION_APPLICATION_ID, provider, redirectUri: FEDERATION_CALLBACK_URL, intent: 'LOGIN' },
    });
    if (r.status !== 200 || !r.data?.authorizationUrl) return loginRedirect(res, errorCode(r.data?.error, r.status));
    setStateCookie(req, res, { state: r.data.state, provider, returnTo: safeReturnTo(req.query.returnTo) });
    return res.redirect(302, r.data.authorizationUrl);
  } catch (err) {
    logger.error(`Federation start (${provider}): ${err.message}`);
    return loginRedirect(res, 'unavailable');
  }
});

/** The provider sent the person back (GET: Google, Microsoft, GitHub, Meta; POST form_post: Apple). */
async function handleCallback(req, res) {
  if (!ENABLED) return res.status(404).json({ error: 'Not found' });
  const input = req.method === 'POST' ? req.body ?? {} : req.query;
  const remembered = readStateCookie(req);
  clearStateCookie(res, remembered?.provider);

  if (typeof input.error === 'string') return loginRedirect(res, input.error === 'access_denied' ? 'denied' : 'failed');
  const { state, code } = input;
  // the state must be the one this browser started: without that cookie a callback is somebody else's request
  if (typeof state !== 'string' || typeof code !== 'string' || !remembered || remembered.state !== state) return loginRedirect(res, 'expired');

  try {
    const r = await callBackbone({ method: 'POST', path: '/api/v1/federation/callback', data: { state, code } });
    if (r.status !== 200) return loginRedirect(res, errorCode(r.data?.error, r.status));
    if (!r.data?.token) return loginRedirect(res, 'failed');
    // the tokens wait server-side for one minute; the SPA trades the opaque ticket for them (never in a URL)
    const ticket = await tickets.create({ token: r.data.token, refreshToken: r.data.refreshToken }, TICKET_TTL_SECONDS);
    return res.redirect(302, `${COMPLETE_PATH}?ticket=${encodeURIComponent(ticket)}&returnTo=${encodeURIComponent(safeReturnTo(remembered.returnTo))}`);
  } catch (err) {
    logger.error(`Federation callback (${remembered.provider}): ${err.message}`);
    return loginRedirect(res, 'unavailable');
  }
}

router.get('/callback', handleCallback);
router.post('/callback', handleCallback);

/** The SPA trades the one-time ticket for the session (single use: it is removed the moment it is read). */
router.post('/exchange', async (req, res) => {
  const ticket = req.body?.ticket;
  if (typeof ticket !== 'string' || ticket === '') return res.status(400).json({ error: 'ticket is required' });
  const tokens = await tickets.get(ticket);
  await tickets.remove(ticket);
  if (!tokens) return res.status(401).json({ error: 'expired' });
  // with SESSION_COOKIE the real tokens stay server-side and the browser gets unsigned copies, exactly as after a password login
  return res.json(await establishSession(req, res, tokens));
});

module.exports = router;
module.exports.safeReturnTo = safeReturnTo;
