'use strict';

const http = require('node:http');
const express = require('express');

/** Starts a fake backbone-rest that records every request it receives. */
function startFakeBackbone(handler, port = 0) {
  const requests = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const record = {
        method: req.method,
        url: req.url,
        path: req.url.split('?')[0],
        headers: req.headers,
        body: Buffer.concat(chunks),
      };
      requests.push(record);
      if (handler) return handler(record, res);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, path: record.path }));
    });
  });
  return new Promise((resolve) =>
    server.listen(port, '127.0.0.1', () =>
      resolve({
        requests,
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((r) => server.close(r)),
      })
    )
  );
}

/** Mounts routers on a fresh express app listening on an ephemeral port. */
function startApp(mounts) {
  const app = express();
  app.use(express.json());
  for (const [prefix, router] of mounts) app.use(prefix, router);
  return new Promise((resolve) => {
    const server = http.createServer(app).listen(0, '127.0.0.1', () =>
      resolve({
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((r) => server.close(r)),
      })
    );
  });
}

module.exports = { startFakeBackbone, startApp };
