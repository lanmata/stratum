'use strict';

const { before, after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const https = require('node:https');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { buildHttpsAgent } = require('../config/tls');

let hasOpenssl = true;
try {
  execFileSync('openssl', ['version'], { stdio: 'ignore' });
} catch {
  hasOpenssl = false;
}

/** Generates a CA and a server certificate for `backbone.test` / 127.0.0.1 signed by it. */
function makePki(dir, name) {
  const run = (...args) => execFileSync('openssl', args, { cwd: dir, stdio: 'ignore' });
  run('req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', `${name}-ca.key`, '-out', `${name}-ca.crt`, '-subj', `/CN=${name} CA`, '-days', '2');
  run('req', '-newkey', 'rsa:2048', '-nodes', '-keyout', `${name}-srv.key`, '-out', `${name}-srv.csr`, '-subj', '/CN=backbone.test');
  fs.writeFileSync(path.join(dir, `${name}.ext`), 'subjectAltName=DNS:backbone.test,IP:127.0.0.1\n');
  run('x509', '-req', '-in', `${name}-srv.csr`, '-CA', `${name}-ca.crt`, '-CAkey', `${name}-ca.key`, '-CAcreateserial', '-out', `${name}-srv.crt`, '-days', '2', '-extfile', `${name}.ext`);
  return {
    ca: path.join(dir, `${name}-ca.crt`),
    key: fs.readFileSync(path.join(dir, `${name}-srv.key`)),
    cert: fs.readFileSync(path.join(dir, `${name}-srv.crt`)),
  };
}

function get(agent, port, servername) {
  return new Promise((resolve, reject) => {
    const req = https.get({ host: '127.0.0.1', port, path: '/', agent, headers: { host: 'backbone.test' } }, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
  });
}

describe('buildHttpsAgent', { skip: !hasOpenssl && 'openssl is not available' }, () => {
  let dir;
  let pki;
  let other;
  let server;
  let port;
  const warnings = [];
  const logger = { warn: (m) => warnings.push(m) };

  before(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stratum-tls-'));
    pki = makePki(dir, 'real');
    other = makePki(dir, 'other');
    server = https.createServer({ key: pki.key, cert: pki.cert }, (_req, res) => res.end('ok'));
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
  });

  after(async () => {
    await new Promise((r) => server.close(r));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('verifies the certificate against the configured CA and accepts the right one', async () => {
    const { agent, verified } = buildHttpsAgent({ caPath: pki.ca, servername: 'backbone.test' }, { logger });
    assert.equal(verified, true);
    assert.equal(await get(agent, port), 200);
  });

  it('refuses a certificate signed by another CA', async () => {
    const { agent } = buildHttpsAgent({ caPath: other.ca, servername: 'backbone.test' }, { logger });
    await assert.rejects(get(agent, port), /self[- ]signed|unable to verify|certificate/i);
  });

  it('checks the name: the right CA is not enough when the name does not match', async () => {
    const { agent } = buildHttpsAgent({ caPath: pki.ca, servername: 'someone-else.test' }, { logger });
    await assert.rejects(get(agent, port), /altname|hostname|certificate/i);
  });

  it('insecure on purpose accepts anything and says so', async () => {
    warnings.length = 0;
    const { agent, verified } = buildHttpsAgent({ insecure: true }, { logger });
    assert.equal(verified, false);
    assert.equal(await get(agent, port), 200);
    assert.match(warnings[0], /BACKBONE_TLS_INSECURE=true/);
  });

  it('insecure wins over a configured CA', () => {
    const { verified } = buildHttpsAgent({ caPath: pki.ca, insecure: true }, { logger });
    assert.equal(verified, false);
  });

  it('with nothing configured it keeps the old behaviour and warns how to turn verification on', async () => {
    warnings.length = 0;
    const { agent, verified } = buildHttpsAgent({}, { logger });
    assert.equal(verified, false);
    assert.equal(await get(agent, port), 200);
    assert.match(warnings[0], /BACKBONE_CA_PATH/);
  });

  it('reads the CA through the injected reader and fails clearly when the file is missing', () => {
    assert.throws(() => buildHttpsAgent({ caPath: '/does/not/exist.pem' }, { logger }), /ENOENT/);
    const seen = [];
    buildHttpsAgent({ caPath: 'x.pem' }, { logger, readFile: (p) => (seen.push(p), fs.readFileSync(pki.ca)) });
    assert.deepEqual(seen, ['x.pem']);
  });
});
