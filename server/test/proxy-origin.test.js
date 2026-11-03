'use strict';

const { after, before, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('node:http');
const { startFakeBackbone } = require('./helpers');

describe('proxy forwards the person\'s origin to backbone', () => {
  let backbone;
  let server;
  let base;

  before(async () => {
    backbone = await startFakeBackbone();
    process.env.BACKBONE_BASE_URL = backbone.url;
    const proxy = require('../shared/proxy');
    const app = express();
    app.use(express.json());
    app.all('/json', (req, res) => proxy.proxyToBackbone(req, res, '/json'));
    server = http.createServer(app);
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((r) => server.close(r));
    await backbone.close();
  });

  it('adds X-Forwarded-For and X-Forwarded-User-Agent', async () => {
    await fetch(`${base}/json`, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) Safari/605.1' } });
    const seen = backbone.requests.at(-1);
    assert.equal(seen.headers['x-forwarded-user-agent'], 'Mozilla/5.0 (Macintosh) Safari/605.1');
    assert.match(seen.headers['x-forwarded-for'], /^(127\.0\.0\.1|::1)$/);
  });

  it('overwrites an X-Forwarded-For sent by the caller', async () => {
    await fetch(`${base}/json`, { headers: { 'X-Forwarded-For': '6.6.6.6' } });
    assert.notEqual(backbone.requests.at(-1).headers['x-forwarded-for'], '6.6.6.6');
  });
});
