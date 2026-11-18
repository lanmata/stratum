'use strict';

const { before, after, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const { startFakeBackbone } = require('./helpers');

const CALLBACK_URL = 'https://stratum.test/bff/federation/callback';
const APP_ID = '0cfae22b-2c3c-417b-9649-ac9fc3027275';
let fake;
let behaviour;

// the BFF reads its environment when it is loaded
process.env.BACKBONE_BASE_URL = 'http://127.0.0.1:18951';
process.env.FEDERATION_ENABLED = 'true';
process.env.FEDERATION_CALLBACK_URL = CALLBACK_URL;
process.env.FEDERATION_APPLICATION_ID = APP_ID;
process.env.SESSION_COOKIE = 'false';

const federationRoutes = require('../routes/federation.routes');
const adminRoutes = require('../routes/federation-admin.routes');
const identityRoutes = require('../routes/federated-identities.routes');

let server;
let base;
const call = (path, { method = 'GET', body, cookie, form } = {}) =>
  fetch(`${base}${path}`, {
    method,
    redirect: 'manual',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });
const cookies = (res) => res.headers.getSetCookie().join(' | ');
const location = (res) => res.headers.get('location');
const stateCookie = (provider = 'google', returnTo = '/users') =>
  `stratum_fed_state=${Buffer.from(JSON.stringify({ state: 'st-1', provider, returnTo })).toString('base64url')}`;
const lastCall = (suffix) => fake.requests.filter((r) => r.path.endsWith(suffix)).at(-1);

before(async () => {
  fake = await startFakeBackbone((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const send = (status, body) => {
      res.statusCode = status;
      res.end(body === undefined ? '' : JSON.stringify(body));
    };
    if (req.path === '/api/v1/federation/providers') return send(200, behaviour.providers);
    if (req.path === '/api/v1/federation/authorize') {
      if (behaviour.authorizeStatus) return send(behaviour.authorizeStatus, { error: behaviour.authorizeError });
      return send(200, { authorizationUrl: 'https://idp.example/auth?state=st-1', state: 'st-1' });
    }
    if (req.path === '/api/v1/federation/callback') {
      if (behaviour.callbackStatus) return send(behaviour.callbackStatus, { error: behaviour.callbackError });
      return send(200, behaviour.callbackBody ?? { token: 'h.p.s', refreshToken: 'h.r.s' });
    }
    return send(200, { ok: true, path: req.path });
  }, 18951);
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/bff/federation', federationRoutes);
  app.use('/api/v1/federation/admin', adminRoutes);
  app.use('/api/v1/users/:userId/federated-identities', identityRoutes);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fake.close();
});

beforeEach(() => {
  behaviour = { providers: [{ provider: 'google', displayName: 'Google' }] };
  fake.requests.length = 0;
});

describe('social sign-in flow', () => {
  it('lists the providers of the application', async () => {
    const res = await call('/bff/federation/providers');
    assert.deepEqual(await res.json(), { enabled: true, providers: [{ provider: 'google', displayName: 'Google' }] });
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.match(lastCall('/providers').url, new RegExp(`applicationId=${APP_ID}`));
  });

  it('an unavailable backbone leaves the list empty', async () => {
    behaviour.providers = { error: 'x' };
    assert.deepEqual(await (await call('/bff/federation/providers')).json(), { enabled: true, providers: [] });
  });

  it('start remembers the state in an httpOnly cookie and sends the person to the provider', async () => {
    const res = await call('/bff/federation/google/start?returnTo=/users');

    assert.equal(res.status, 302);
    assert.equal(location(res), 'https://idp.example/auth?state=st-1');
    assert.match(cookies(res), /stratum_fed_state=.*HttpOnly/);
    assert.match(cookies(res), /SameSite=Lax/);
    assert.match(cookies(res), /Path=\/bff\/federation/);
    assert.deepEqual(JSON.parse(lastCall('/authorize').body.toString()), {
      applicationId: APP_ID, provider: 'google', redirectUri: CALLBACK_URL, intent: 'LOGIN',
    });
    const remembered = JSON.parse(Buffer.from(/stratum_fed_state=([^;]+)/.exec(cookies(res))[1], 'base64url').toString());
    assert.deepEqual(remembered, { state: 'st-1', provider: 'google', returnTo: '/users' });
  });

  it('Apple needs a cross-site secure cookie', async () => {
    const res = await call('/bff/federation/apple/start');
    assert.match(cookies(res), /SameSite=None/);
    assert.match(cookies(res), /Secure/);
  });

  it('a hostile returnTo falls back to the dashboard', async () => {
    for (const returnTo of ['//evil.example', 'https://evil.example', '/\\evil', '/ok\r\nSet-Cookie: x=1', 'javascript:alert(1)']) {
      const res = await call(`/bff/federation/google/start?returnTo=${encodeURIComponent(returnTo)}`);
      const remembered = JSON.parse(Buffer.from(/stratum_fed_state=([^;]+)/.exec(cookies(res))[1], 'base64url').toString());
      assert.equal(remembered.returnTo, '/dashboard', returnTo);
    }
  });

  it('start refuses a malformed provider and maps backbone errors', async () => {
    assert.equal(location(await call('/bff/federation/G!/start')), '/auth/login?error=unavailable');
    behaviour.authorizeStatus = 404;
    behaviour.authorizeError = 'federation_provider_not_found';
    assert.equal(location(await call('/bff/federation/github/start')), '/auth/login?error=unavailable');
    behaviour.authorizeStatus = 429;
    behaviour.authorizeError = 'federation_rate_limited';
    assert.equal(location(await call('/bff/federation/github/start')), '/auth/login?error=rate_limited');
  });

  it('the callback hands the tokens over through a one-time ticket, never in the URL', async () => {
    const res = await call('/bff/federation/callback?code=c-1&state=st-1', { cookie: stateCookie() });

    assert.equal(res.status, 302);
    const target = new URL(location(res), 'https://x');
    assert.equal(target.pathname, '/auth/federation/complete');
    assert.equal(target.searchParams.get('returnTo'), '/users');
    assert.ok(!location(res).includes('h.p.s'), 'no token in the URL');
    assert.match(cookies(res), /stratum_fed_state=; .*Max-Age=0/);
    assert.deepEqual(JSON.parse(lastCall('/callback').body.toString()), { state: 'st-1', code: 'c-1' });

    const ticket = target.searchParams.get('ticket');
    const exchanged = await call('/bff/federation/exchange', { method: 'POST', body: { ticket } });
    assert.equal(exchanged.status, 200);
    assert.deepEqual(await exchanged.json(), { token: 'h.p.s', refreshToken: 'h.r.s' });

    const replay = await call('/bff/federation/exchange', { method: 'POST', body: { ticket } });
    assert.equal(replay.status, 401, 'a ticket works once');
  });

  it('exchange needs a ticket and refuses an unknown one', async () => {
    assert.equal((await call('/bff/federation/exchange', { method: 'POST', body: {} })).status, 400);
    assert.equal((await call('/bff/federation/exchange', { method: 'POST', body: { ticket: 5 } })).status, 400);
    assert.equal((await call('/bff/federation/exchange', { method: 'POST', body: { ticket: 'nope' } })).status, 401);
  });

  it('a callback that is not the one of this browser never reaches backbone', async () => {
    for (const [path, cookie] of [
      ['/bff/federation/callback?code=c&state=other', stateCookie()],
      ['/bff/federation/callback?code=c&state=st-1', undefined],
      ['/bff/federation/callback?code=c&state=st-1', 'stratum_fed_state=not-base64-json'],
      ['/bff/federation/callback?state=st-1', stateCookie()],
      ['/bff/federation/callback?code=c', stateCookie()],
    ]) {
      fake.requests.length = 0;
      const res = await call(path, { cookie });
      assert.equal(location(res), '/auth/login?error=expired', path);
      assert.equal(fake.requests.filter((r) => r.path.endsWith('/callback')).length, 0);
    }
  });

  it('a provider denial is told apart from a failure', async () => {
    assert.equal(location(await call('/bff/federation/callback?error=access_denied&state=st-1', { cookie: stateCookie() })), '/auth/login?error=denied');
    assert.equal(location(await call('/bff/federation/callback?error=server_error&state=st-1', { cookie: stateCookie() })), '/auth/login?error=failed');
  });

  it('every backbone refusal becomes a stable login error code', async () => {
    const cases = {
      federation_state_invalid: 'expired',
      federation_token_invalid: 'failed',
      federation_not_registered: 'not_registered',
      federation_email_not_allowed: 'not_allowed',
      federation_not_linked: 'not_linked',
      federation_not_allowed: 'not_allowed',
      federation_identity_conflict: 'conflict',
      federation_idp_unavailable: 'unavailable',
      federation_rate_limited: 'rate_limited',
      federation_a_future_code: 'failed',
    };
    for (const [error, code] of Object.entries(cases)) {
      behaviour.callbackStatus = 403;
      behaviour.callbackError = error;
      assert.equal(location(await call('/bff/federation/callback?code=c&state=st-1', { cookie: stateCookie() })), `/auth/login?error=${code}`, error);
    }
    behaviour.callbackStatus = 502;
    behaviour.callbackError = undefined;
    assert.equal(location(await call('/bff/federation/callback?code=c&state=st-1', { cookie: stateCookie() })), '/auth/login?error=unavailable');
  });

  it('a 200 without a token is a failure', async () => {
    behaviour.callbackBody = {};
    assert.equal(location(await call('/bff/federation/callback?code=c&state=st-1', { cookie: stateCookie() })), '/auth/login?error=failed');
  });

  it("Apple's form POST callback works the same way", async () => {
    const res = await call('/bff/federation/callback', { method: 'POST', form: 'code=c-1&state=st-1', cookie: stateCookie('apple') });
    assert.equal(res.status, 302);
    assert.equal(new URL(location(res), 'https://x').pathname, '/auth/federation/complete');
    assert.match(cookies(res), /SameSite=None/);
  });
});

describe('administration and linked accounts are exposed narrowly', () => {
  const ID = '11111111-1111-4111-8111-111111111111';

  it('forwards the provider settings to backbone', async () => {
    for (const [method, path, expected] of [
      ['GET', '/api/v1/federation/admin/providers?applicationId=a', '/api/v1/federation/admin/providers'],
      ['POST', '/api/v1/federation/admin/providers', '/api/v1/federation/admin/providers'],
      ['GET', `/api/v1/federation/admin/providers/${ID}`, `/api/v1/federation/admin/providers/${ID}`],
      ['PUT', `/api/v1/federation/admin/providers/${ID}`, `/api/v1/federation/admin/providers/${ID}`],
      ['DELETE', `/api/v1/federation/admin/providers/${ID}`, `/api/v1/federation/admin/providers/${ID}`],
    ]) {
      fake.requests.length = 0;
      const res = await call(path, { method, body: method === 'POST' || method === 'PUT' ? { a: 1 } : undefined });
      assert.equal(res.status, 200, `${method} ${path}`);
      assert.equal(fake.requests.at(-1).path, expected);
      assert.equal(fake.requests.at(-1).method, method);
    }
  });

  it('never exposes the public sign-in endpoints of backbone', async () => {
    for (const path of ['/api/v1/federation/admin/authorize', '/api/v1/federation/admin/callback', '/api/v1/federation/admin/']) {
      assert.equal((await call(path)).status, 404, path);
    }
  });

  it('refuses ids that are not UUIDs', async () => {
    assert.equal((await call('/api/v1/federation/admin/providers/not-a-uuid')).status, 400);
    assert.equal((await call('/api/v1/users/not-a-uuid/federated-identities')).status, 400);
    assert.equal((await call(`/api/v1/users/${ID}/federated-identities/not-a-uuid`, { method: 'DELETE' })).status, 400);
  });

  it('lists and unlinks the identities of a user', async () => {
    fake.requests.length = 0;
    assert.equal((await call(`/api/v1/users/${ID}/federated-identities`)).status, 200);
    assert.equal(fake.requests.at(-1).path, `/api/v1/users/${ID}/federated-identities`);
    assert.equal((await call(`/api/v1/users/${ID}/federated-identities/${ID}`, { method: 'DELETE' })).status, 200);
    assert.equal(fake.requests.at(-1).path, `/api/v1/users/${ID}/federated-identities/${ID}`);
    assert.equal(fake.requests.at(-1).method, 'DELETE');
  });
});
