// Starts the stack the e2e tests run against: the fake backbone and the real BFF (serving the built app) over HTTPS with a
// throwaway certificate. Playwright starts this file and waits for the BFF port.
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFakeBackbone } from './fake-backbone.mjs';

const BFF_PORT = Number(process.env.E2E_PORT ?? 4443);
const BACKBONE_PORT = Number(process.env.E2E_BACKBONE_PORT ?? 4199);

const dir = mkdtempSync(join(tmpdir(), 'stratum-e2e-'));
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(dir, 'k.pem'), '-out', join(dir, 'c.pem'),
  '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1', '-days', '2'], { stdio: 'ignore' });

await startFakeBackbone(BACKBONE_PORT);
const bff = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(BFF_PORT), NODE_ENV: 'development', LOG_LEVEL: 'warn', BACKBONE_BASE_URL: `http://127.0.0.1:${BACKBONE_PORT}`,
    REDIS_URL: 'redis://127.0.0.1:1', SSL_CERT_PATH: join(dir, 'c.pem'), SSL_KEY_PATH: join(dir, 'k.pem'), NG_ALLOWED_HOSTS: 'localhost' },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { bff.kill(); process.exit(0); });
bff.on('exit', (code) => process.exit(code ?? 0));
