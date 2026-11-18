'use strict';

const { before, after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

process.env.BACKBONE_BASE_URL = 'http://127.0.0.1:18952';
delete process.env.FEDERATION_ENABLED;

const federationRoutes = require('../routes/federation.routes');

let server;
let base;
before(async () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/bff/federation', federationRoutes);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));

describe('social sign-in is off by default', () => {
  it('the login page learns there are no providers and nothing else answers', async () => {
    assert.deepEqual(await (await fetch(`${base}/bff/federation/providers`)).json(), { enabled: false, providers: [] });
    for (const [method, path] of [['GET', '/google/start'], ['GET', '/callback?code=c&state=s'], ['POST', '/callback'], ['POST', '/exchange']]) {
      const res = await fetch(`${base}/bff/federation${path}`, { method, redirect: 'manual', headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? '{}' : undefined });
      assert.equal(res.status, 404, `${method} ${path}`);
    }
  });
});
