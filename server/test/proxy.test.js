'use strict';

const { before, after, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const multer = require('multer');
const http = require('node:http');
const { startFakeBackbone } = require('./helpers');

describe('proxy', () => {
  let backbone;
  let behaviour;
  let server;
  let base;
  let proxy;

  before(async () => {
    backbone = await startFakeBackbone((record, res) => behaviour(record, res));
    process.env.BACKBONE_BASE_URL = backbone.url;
    proxy = require('../shared/proxy');

    const upload = multer({ storage: multer.memoryStorage() });
    const app = express();
    app.use(express.json());
    app.all('/json', (req, res) => proxy.proxyToBackbone(req, res, '/json'));
    app.get('/binary', (req, res) =>
      proxy.proxyToBackbone(req, res, '/binary', { responseType: 'arraybuffer', sessionHeader: true })
    );
    app.post('/multi', upload.single('file'), (req, res) =>
      proxy.proxyMultipart(req, res, '/multi', {
        jsonFields: ['meta'],
        sessionHeader: true,
        statusMap: { 302: 200 },
      })
    );
    app.post('/multi-binary', upload.single('file'), (req, res) =>
      proxy.proxyMultipart(req, res, '/multi-binary', { binaryResponse: true })
    );
    app.post('/multi-none', upload.none(), (req, res) =>
      proxy.proxyMultipart(req, res, '/multi-none')
    );
    server = http.createServer(app);
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((r) => server.close(r));
    await backbone.close();
  });

  beforeEach(() => {
    backbone.requests.length = 0;
    behaviour = (_r, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end('{"ok":true}');
    };
  });

  it('sends Bearer authorization derived from the session-token header', async () => {
    await fetch(`${base}/json`, { headers: { 'session-token': 'abc' } });
    const seen = backbone.requests[0];
    assert.equal(seen.headers['authorization'], 'Bearer abc');
    assert.equal(seen.headers['session-token'], undefined);
  });

  it('omits authorization when there is no session token', async () => {
    await fetch(`${base}/json`);
    assert.equal(backbone.requests[0].headers['authorization'], undefined);
  });

  it('only sends a body on POST/PUT/PATCH and relays query params', async () => {
    await fetch(`${base}/json?x=1`);
    assert.equal(backbone.requests[0].url, '/json?x=1');
    assert.equal(backbone.requests[0].body.length, 0);
    await fetch(`${base}/json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{"a":2}',
    });
    assert.equal(backbone.requests[1].body.toString(), '{"a":2}');
  });

  it('relays upstream status, body and Warning header', async () => {
    behaviour = (_r, res) => {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Warning', '199 stale');
      res.end('{"error":"nope"}');
    };
    const res = await fetch(`${base}/json`);
    assert.equal(res.status, 404);
    assert.equal(res.headers.get('warning'), '199 stale');
    assert.deepEqual(await res.json(), { error: 'nope' });
  });

  it('answers 502 when backbone is unreachable', async () => {
    const dead = await startFakeBackbone();
    const url = dead.url;
    await dead.close();
    const saved = backbone.url;
    process.env.BACKBONE_BASE_URL = url;
    delete require.cache[require.resolve('../config/constants')];
    delete require.cache[require.resolve('../shared/proxy')];
    const isolated = require('../shared/proxy');
    const app = express();
    app.get('/x', (req, res) => isolated.proxyToBackbone(req, res, '/x'));
    const srv = http.createServer(app);
    await new Promise((r) => srv.listen(0, '127.0.0.1', r));
    const res = await fetch(`http://127.0.0.1:${srv.address().port}/x`);
    assert.equal(res.status, 502);
    assert.deepEqual(await res.json(), { error: 'Backend unavailable' });
    await new Promise((r) => srv.close(r));
    process.env.BACKBONE_BASE_URL = saved;
    delete require.cache[require.resolve('../config/constants')];
    delete require.cache[require.resolve('../shared/proxy')];
  });

  it('streams binary bodies untouched with content headers and the raw session header', async () => {
    const bytes = Buffer.from([0, 1, 2, 250, 255]);
    behaviour = (_r, res) => {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename="a.png"');
      res.end(bytes);
    };
    const res = await fetch(`${base}/binary`, { headers: { 'session-token': 'tk' } });
    assert.equal(res.headers.get('content-type'), 'image/png');
    assert.equal(res.headers.get('content-disposition'), 'attachment; filename="a.png"');
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), bytes);
    assert.equal(backbone.requests[0].headers['session-token'], 'tk');
    assert.equal(backbone.requests[0].headers['authorization'], 'Bearer tk');
  });

  it('keeps upstream error status for binary responses without content headers', async () => {
    behaviour = (_r, res) => {
      res.statusCode = 404;
      res.end('');
    };
    const res = await fetch(`${base}/binary`);
    assert.equal(res.status, 404);
  });

  it('forwards multipart files and fields, sending JSON fields as json parts', async () => {
    const form = new FormData();
    form.append('file', new Blob(['hello'], { type: 'text/plain' }), 'a.txt');
    form.append('meta', '{"k":"v"}');
    form.append('plain', 'text');
    const res = await fetch(`${base}/multi`, {
      method: 'POST',
      headers: { 'session-token': 'tk' },
      body: form,
    });
    assert.equal(res.status, 200);
    const seen = backbone.requests[0];
    assert.match(seen.headers['content-type'], /^multipart\/form-data; boundary=/);
    const raw = seen.body.toString();
    assert.match(raw, /name="file"; filename="a.txt"/);
    assert.match(raw, /hello/);
    assert.match(raw, /name="meta"[\s\S]*Content-Type: application\/json[\s\S]*\{"k":"v"\}/);
    assert.match(raw, /name="plain"[\s\S]*text/);
    assert.equal(seen.headers['session-token'], 'tk');
  });

  it('rewrites upstream status codes through statusMap', async () => {
    behaviour = (_r, res) => {
      res.statusCode = 302;
      res.setHeader('Content-Type', 'application/json');
      res.end('["a","b"]');
    };
    const form = new FormData();
    form.append('file', new Blob(['x']), 'a.txt');
    const res = await fetch(`${base}/multi`, { method: 'POST', body: form });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), ['a', 'b']);
  });

  it('returns binary multipart responses', async () => {
    behaviour = (_r, res) => {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.end(Buffer.from('DOCX'));
    };
    const form = new FormData();
    form.append('file', new Blob(['x']), 'a.docx');
    const res = await fetch(`${base}/multi-binary`, { method: 'POST', body: form });
    assert.equal(await res.text(), 'DOCX');
  });

  it('handles multipart requests that carry no file or body', async () => {
    const res = await fetch(`${base}/multi-none`, { method: 'POST', body: new FormData() });
    assert.equal(res.status, 200);
  });
});
