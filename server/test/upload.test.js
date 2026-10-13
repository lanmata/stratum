'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('node:http');
const multer = require('multer');
const { handleUpload, MAX_FILE_BYTES } = require('../shared/upload');

describe('handleUpload', () => {
  let server;
  let base;

  before(async () => {
    const app = express();
    app.post(
      '/ok',
      handleUpload((m) => m.single('image')),
      (req, res) => res.json({ size: req.file?.size ?? 0 })
    );
    app.post(
      '/small',
      handleUpload(
        (m) => m.single('image'),
        multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 } })
      ),
      (req, res) => res.json({ size: req.file?.size ?? 0 })
    );
    server = http.createServer(app);
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => new Promise((r) => server.close(r)));

  it('limits uploads to 10 MB by default', () => {
    assert.equal(MAX_FILE_BYTES, 10 * 1024 * 1024);
  });

  it('accepts a file within the limit', async () => {
    const form = new FormData();
    form.append('image', new Blob(['abc']), 'a.png');
    const res = await fetch(`${base}/ok`, { method: 'POST', body: form });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { size: 3 });
  });

  it('answers 413 when the file is too large', async () => {
    const form = new FormData();
    form.append('image', new Blob(['too-large']), 'a.png');
    const res = await fetch(`${base}/small`, { method: 'POST', body: form });
    assert.equal(res.status, 413);
    assert.ok((await res.json()).error);
  });

  it('answers 400 on an unexpected field', async () => {
    const form = new FormData();
    form.append('other', new Blob(['abc']), 'a.png');
    const res = await fetch(`${base}/ok`, { method: 'POST', body: form });
    assert.equal(res.status, 400);
  });
});
