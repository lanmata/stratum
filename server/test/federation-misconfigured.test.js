'use strict';

const { before, after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

process.env.BACKBONE_BASE_URL = 'http://127.0.0.1:18953';
process.env.FEDERATION_ENABLED = 'true';
delete process.env.FEDERATION_CALLBACK_URL;
delete process.env.FEDERATION_APPLICATION_ID;

const federationRoutes = require('../routes/federation.routes');

let server;
let base;
before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/bff/federation', federationRoutes);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));

describe('social sign-in switched on without its settings', () => {
  it('stays off: no providers and every other route is a 404', async () => {
    assert.deepEqual(await (await fetch(`${base}/bff/federation/providers`)).json(), { enabled: false, providers: [] });
    assert.equal((await fetch(`${base}/bff/federation/google/start`, { redirect: 'manual' })).status, 404);
  });
});
