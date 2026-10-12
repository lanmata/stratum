'use strict';

const { before, after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { startFakeBackbone, startApp } = require('./helpers');


/**
 * backbone-rest's session endpoints are public. The session token must reach them in `session-token`, never as
 * `Authorization: Bearer`: backbone's filter answers 401 to an expired Bearer before the endpoint runs, and on these
 * endpoints `Authorization` belongs to an application client.
 */
describe('session routes', () => {
  let backbone;
  let app;
  let base;

  before(async () => {
    backbone = await startFakeBackbone((record, res) => {
      if (record.path.endsWith('/logout')) {
        res.statusCode = 204;
        return res.end();
      }
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(record.path.endsWith('/validate') ? true : { token: 't', refreshToken: 'r' }));
    });
    // the BFF reads BACKBONE_BASE_URL when it is first loaded: point it at the fake before requiring the routes
    process.env.BACKBONE_BASE_URL = backbone.url;
    app = await startApp([['/api/v1/session', require('../routes/session.routes')]]);
    base = `${app.url}/api/v1/session`;
  });

  after(async () => {
    await app.close();
    await backbone.close();
  });

  const last = () => backbone.requests.at(-1);
  const json = (body, headers = {}) => ({
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  });

  it('logs in without inventing an Authorization header', async () => {
    const res = await fetch(`${base}/token`, json({ email: 'a@b.c', password: 'pw', applicationId: 'app' }));

    assert.equal(res.status, 200);
    assert.equal(last().path, '/api/v1/session/token');
    assert.equal(last().headers.authorization, undefined);
    assert.deepEqual(JSON.parse(last().body), { email: 'a@b.c', password: 'pw', applicationId: 'app' });
  });

  it('alias login is forwarded the same way', async () => {
    await fetch(`${base}/`, json({ alias: 'ana', password: 'pw', applicationId: 'app' }));

    assert.equal(last().path, '/api/v1/session');
    assert.equal(last().headers.authorization, undefined);
  });

  it('refresh never carries the (possibly expired) session token as a Bearer', async () => {
    const res = await fetch(`${base}/refresh`, json({ refreshToken: 'r' }, { 'session-token': 'expired' }));

    assert.equal(res.status, 200);
    assert.equal(last().path, '/api/v1/session/refresh');
    assert.equal(last().headers.authorization, undefined);
    assert.equal(last().headers['session-token'], undefined);
  });

  for (const route of ['validate', 'renew']) {
    it(`${route} sends the session token in the session-token header`, async () => {
      const res = await fetch(`${base}/${route}`, { headers: { 'session-token': 'tok' } });

      assert.equal(res.status, 200);
      assert.equal(last().path, `/api/v1/session/${route}`);
      assert.equal(last().headers['session-token'], 'tok');
      assert.equal(last().headers.authorization, undefined);
    });
  }

  it('logout revokes the session token and the refresh token of the body', async () => {
    const res = await fetch(`${base}/logout`, json({ refreshToken: 'r' }, { 'session-token': 'tok' }));

    assert.equal(res.status, 204);
    assert.equal(last().method, 'POST');
    assert.equal(last().path, '/api/v1/session/logout');
    assert.equal(last().headers['session-token'], 'tok');
    assert.equal(last().headers.authorization, undefined);
    assert.deepEqual(JSON.parse(last().body), { refreshToken: 'r' });
  });
});
