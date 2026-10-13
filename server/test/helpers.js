'use strict';

const https = require('node:https');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const express = require('express');
const helmet = require('helmet');

/**
 * TLS material for the test servers. Use TEST_TLS_KEY / TEST_TLS_CERT to supply your own; otherwise a
 * throwaway self-signed certificate is generated once with the openssl CLI, so the suite does not depend
 * on certificates existing at fixed paths of the machine running it.
 */
function loadTlsOptions() {
  const { TEST_TLS_KEY: keyPath, TEST_TLS_CERT: certPath } = process.env;
  if (keyPath && certPath) {
    return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stratum-test-tls-'));
  const key = path.join(dir, 'key.pem');
  const cert = path.join(dir, 'cert.pem');
  execFileSync(
    'openssl',
    ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '1',
      '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1'],
    { stdio: 'ignore' }
  );
  return { key: fs.readFileSync(key), cert: fs.readFileSync(cert) };
}

const tlsOptions = loadTlsOptions();
// Test-only: the servers above present a self-signed certificate that fetch() must accept.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/** Starts a fake backbone-rest that records every request it receives. */
function startFakeBackbone(handler, port = 0) {
  const requests = [];
  const server = https.createServer(tlsOptions, (req, res) => {
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
        url: `https://127.0.0.1:${server.address().port}`,
        close: () => new Promise((r) => server.close(r)),
      })
    )
  );
}

/** Mounts routers on a fresh express app listening on an ephemeral port. */
function startApp(mounts) {
  const app = express();
  app.use(helmet());
  app.use(express.json());
  for (const [prefix, router] of mounts) app.use(prefix, router);
  return new Promise((resolve) => {
    const server = https.createServer(tlsOptions, app).listen(0, '127.0.0.1', () =>
      resolve({
        url: `https://127.0.0.1:${server.address().port}`,
        close: () => new Promise((r) => server.close(r)),
      })
    );
  });
}

module.exports = { startFakeBackbone, startApp, tlsOptions };
