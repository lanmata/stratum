'use strict';

process.env.SESSION_COOKIE = 'true';

const { before, after, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('node:http');
const { startFakeBackbone } = require('./helpers');

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (extra = {}) => `${b64({ alg: 'HS256' })}.${b64({ sub: 'u', exp: Math.floor(Date.now() / 1000) + 600, ...extra })}.REALSIGNATURE`;

describe('server-side session (SESSION_COOKIE)', () => {
  let backbone, server, base, real;
  const state = { calls: [] };

  before(async () => {
    backbone = await startFakeBackbone((rec, res) => {
      state.calls.push(rec);
      res.setHeader('Content-Type', 'application/json');
      if (rec.path === '/api/v1/session' || rec.path === '/api/v1/session/token' || rec.path === '/api/v1/session/refresh' || rec.path === '/api/v1/session/renew') {
        real = { token: jwt({ n: Math.random() }), refreshToken: jwt({ r: Math.random() }) };
        return res.end(JSON.stringify(real));
      }
      res.end(JSON.stringify({ ok: true }));
    });
    process.env.BACKBONE_BASE_URL = backbone.url;
    const { cookieSession } = require('../shared/cookie-session');
    const sessionRoutes = require('../routes/session.routes');
    const usersRoutes = require('../routes/users.routes');
    const app = express();
    app.use(express.json());
    app.use('/api', cookieSession());
    app.use('/api/v1/session', sessionRoutes);
    app.use('/api/v1/users', usersRoutes);
    server = http.createServer(app);
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((r) => server.close(r));
    await backbone.close();
  });

  beforeEach(() => {
    state.calls.length = 0;
  });

  async function login() {
    const res = await fetch(`${base}/api/v1/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const cookie = res.headers.get('set-cookie');
    return { res, body: await res.json(), cookie: cookie.split(';')[0], setCookie: cookie };
  }

  it('login keeps the real tokens in the server and gives the browser an HttpOnly cookie and unsigned copies', async () => {
    const { body, setCookie } = await login();

    assert.match(setCookie, /^stratum_sid=[\w-]{40,}; Path=\/; HttpOnly; SameSite=Strict; Max-Age=\d+/);
    assert.ok(body.token.endsWith('.'), 'token has no signature');
    assert.ok(body.refreshToken.endsWith('.'), 'refresh token has no signature');
    assert.ok(!JSON.stringify(body).includes('REALSIGNATURE'));
    assert.equal(JSON.parse(Buffer.from(body.token.split('.')[1], 'base64url')).sub, 'u');
  });

  it('later calls carry the real token from the session, whatever the browser sends', async () => {
    const { cookie, body } = await login();
    state.calls.length = 0;

    await fetch(`${base}/api/v1/users/user/1`, { headers: { cookie, 'session-token': body.token } });

    assert.equal(state.calls[0].headers.authorization, `Bearer ${real.token}`);
    assert.ok(real.token.includes('REALSIGNATURE'));
  });

  it('refuses a state-changing call that has the cookie but not the custom header (CSRF)', async () => {
    const { cookie } = await login();

    const blocked = await fetch(`${base}/api/v1/users`, { method: 'POST', headers: { cookie, 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(blocked.status, 403);
    assert.equal((await blocked.json()).error, 'csrf');
    const allowed = await fetch(`${base}/api/v1/users`, { method: 'POST', headers: { cookie, 'session-token': 'x', 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(allowed.status, 200);
  });

  it('a cookie that names no session is ignored: the call goes on as an anonymous or legacy one', async () => {
    const res = await fetch(`${base}/api/v1/users/user/1`, { headers: { cookie: 'stratum_sid=unknown', 'session-token': 'legacy-full-token' } });

    assert.equal(res.status, 200);
    assert.equal(state.calls[0].headers.authorization, 'Bearer legacy-full-token');
  });

  it('refresh sends the real refresh token and replaces the stored tokens', async () => {
    const { cookie } = await login();
    const first = real;
    state.calls.length = 0;

    const res = await fetch(`${base}/api/v1/session/refresh`, { method: 'POST', headers: { cookie, 'session-token': 'x', 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: 'unsigned.copy.' }) });
    const body = await res.json();

    assert.equal(JSON.parse(state.calls[0].body).refreshToken, first.refreshToken);
    assert.ok(body.token.endsWith('.'));
    state.calls.length = 0;
    await fetch(`${base}/api/v1/users/user/1`, { headers: { cookie, 'session-token': 'x' } });
    assert.equal(state.calls[0].headers.authorization, `Bearer ${real.token}`);
  });

  it('renew stores the new tokens and answers unsigned copies', async () => {
    const { cookie } = await login();

    const res = await fetch(`${base}/api/v1/session/renew`, { headers: { cookie, 'session-token': 'x' } });

    assert.ok((await res.json()).token.endsWith('.'));
  });

  it('logout sends the real tokens, ends the session and clears the cookie', async () => {
    const { cookie } = await login();
    const first = real;
    state.calls.length = 0;

    const res = await fetch(`${base}/api/v1/session/logout`, { method: 'POST', headers: { cookie, 'session-token': 'x', 'Content-Type': 'application/json' }, body: '{}' });

    assert.match(res.headers.get('set-cookie'), /Max-Age=0/);
    assert.equal(JSON.parse(state.calls[0].body).refreshToken, first.refreshToken);
    state.calls.length = 0;
    await fetch(`${base}/api/v1/users/user/1`, { headers: { cookie, 'session-token': 'x' } });
    assert.equal(state.calls[0].headers.authorization, 'Bearer x', 'the session is gone: only the header is left');
  });

  it('a login with an existing session keeps the same cookie', async () => {
    const { cookie } = await login();
    const res = await fetch(`${base}/api/v1/session`, { method: 'POST', headers: { cookie, 'session-token': 'x', 'Content-Type': 'application/json' }, body: '{}' });

    assert.equal(res.headers.get('set-cookie').split(';')[0], cookie);
  });
});
