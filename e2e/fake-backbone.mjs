// A tiny stand-in for backbone-rest: answers the calls the e2e flows make with fixed data.
import http from 'node:http';

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
export const token = () =>
  `${b64({ alg: 'none' })}.${b64({
    sub: 'e2e-user', uid: '11111111-1111-1111-1111-111111111111', aid: '0cfae22b-2c3c-417b-9649-ac9fc3027275',
    firstname: 'E2E', lastname: 'User', roles: '[3fc0322f-b9b6-42dd-be2b-edd440c906d9]', exp: Math.floor(Date.now() / 1000) + 3600,
  })}.sig`;

const weeks = Array.from({ length: 12 }, (_, i) => ({
  period: new Date(Date.UTC(2026, 7, 3 + i * 7)).toISOString().slice(0, 10),
  logins: 5 + ((i * 7) % 23), failures: i % 4 === 0 ? 2 : 0, logouts: 1, activeUsers: 2 + (i % 3),
}));
const routes = {
  'GET /api/v1/session/validate': () => true,
  'GET /api/v1/applications': () => [{ id: '0cfae22b-2c3c-417b-9649-ac9fc3027275', name: 'Backbone Platform', active: true }],
  'GET /api/v1/iam/audit/reports/summary': () => ({ from: '2026-08-06', to: '2026-11-03', events: 405, logins: 363, failures: 30, logouts: 10,
    passwordChanges: 2, otherEvents: 0, activeUsers: 10, sourceIps: 5, applications: 6, failureRate: 0.076, firstEvent: null, lastEvent: null }),
  'GET /api/v1/iam/audit/reports/timeseries': (url) => (url.searchParams.get('granularity') === 'month'
    ? [{ period: '2026-09-01', logins: 12, failures: 9, logouts: 0, activeUsers: 3 }, { period: '2026-10-01', logins: 121, failures: 6, logouts: 4, activeUsers: 5 }]
    : weeks),
  'GET /api/v1/iam/audit/reports/hours': () => Array.from({ length: 24 }, (_, hour) => ({ hour, logins: hour === 14 ? 23 : 2 })),
  'GET /api/v1/iam/audit/reports/heatmap': () => Array.from({ length: 42 }, (_, i) => ({ dayOfWeek: Math.floor(i / 6) + 1, slot: i % 6, logins: i % 5 })),
  'GET /api/v1/iam/audit/reports/applications': () => [
    { applicationId: 'a1', applicationName: 'Backbone Platform', events: 262, logins: 250, failures: 6, activeUsers: 2, registeredUsers: 1, roles: 1 },
    { applicationId: 'a2', applicationName: 'Smart Kin', events: 3, logins: 3, failures: 0, activeUsers: 1, registeredUsers: 5, roles: 3 }],
  'GET /api/v1/iam/audit/reports/clients': () => [{ deviceClass: 'API_CLIENT', browser: 'OTHER', events: 255 }, { deviceClass: 'DESKTOP_BROWSER', browser: 'CHROME', events: 100 }],
};

export function startFakeBackbone(port) {
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const url = new URL(req.url, 'http://x');
      const send = (status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };
      if (req.method === 'POST' && url.pathname === '/api/v1/session') {
        const { password } = JSON.parse(Buffer.concat(chunks).toString() || '{}');
        return password === 'wrong' ? send(401, { error: 'invalid' }) : send(200, { token: token(), refreshToken: token() });
      }
      if (url.pathname === '/api/v1/session/logout') return send(204, {});
      const handler = routes[`${req.method} ${url.pathname}`];
      return send(200, handler ? handler(url) : []);
    });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}
