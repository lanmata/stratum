'use strict';

const { before, after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { startFakeBackbone, startApp } = require('./helpers');

const FAKE_PORT = 18943;
process.env.BACKBONE_BASE_URL = `http://127.0.0.1:${FAKE_PORT}`;

const MOUNTS = [
  ['/api/v1/session', 'session'],
  ['/api/v1/users', 'users'],
  ['/api/v1/roles', 'roles'],
  ['/api/v1/features', 'features'],
  ['/api/v1/people', 'people'],
  ['/api/v1/contacts', 'contacts'],
  ['/api/v1/contact-types', 'contact-types'],
  ['/api/v1/iam/audit', 'audit'],
  ['/api/v1/applications', 'applications'],
  ['/api/v1/service-types', 'service-types'],
  ['/api/v1/managed-clients', 'managed-clients'],
  ['/api/v1/addresses', 'addresses'],
  ['/api/v1/identification-documents', 'identification-documents'],
  ['/api/v1/notice-types', 'notice-types'],
  ['/api/v1/notices', 'notices'],
  ['/api/v1/iam', 'iam'],
  ['/api/v1/profile/image', 'profile-image'],
  ['/api/v1/report', 'report'],
];

// Routes whose backbone path intentionally differs from `mount + route path`.
const EXPECTED_OVERRIDES = {
  'GET /api/v1/service-types/list-all': '/api/v1/service-types/true',
  'GET /api/v1/iam/audit/export': '/api/v1/iam/audit/events',
};

// Multipart routes are exercised in their own tests.
const SKIP = new Set([
  'POST /api/v1/profile/image/application/:applicationId',
  'POST /api/v1/report/template',
  'POST /api/v1/report/placeholdervalues',
]);

function listRoutes(router) {
  return router.stack
    .filter((layer) => layer.route)
    .flatMap((layer) =>
      Object.keys(layer.route.methods).map((method) => ({
        method: method.toUpperCase(),
        path: layer.route.path,
      }))
    );
}

describe('BFF routes proxy to the matching backbone-rest path', () => {
  let backbone;
  let bff;
  const routers = [];

  before(async () => {
    backbone = await startFakeBackbone(undefined, FAKE_PORT);
    for (const [prefix, name] of MOUNTS) routers.push([prefix, require(`../routes/${name}.routes`)]);
    bff = await startApp(routers);
  });

  after(async () => {
    await bff.close();
    await backbone.close();
  });

  for (const [prefix, name] of MOUNTS) {
    const router = require(`../routes/${name}.routes`);
    for (const { method, path } of listRoutes(router)) {
      const label = `${method} ${prefix}${path === '/' ? '' : path}`;
      if (SKIP.has(label)) continue;

      it(label, async () => {
        const concrete = path.replace(/:(\w+)/g, (_m, key) => `v-${key}`);
        const publicPath = `${prefix}${concrete === '/' ? '' : concrete}`;
        const expected =
          EXPECTED_OVERRIDES[`${method} ${prefix}${path}`] ??
          `${prefix}${concrete}`;

        backbone.requests.length = 0;
        const res = await fetch(`${bff.url}${publicPath}`, {
          method,
          headers: { 'Content-Type': 'application/json', 'session-token': 'tok-123' },
          body: ['POST', 'PUT', 'PATCH'].includes(method) ? JSON.stringify({ a: 1 }) : undefined,
        });

        assert.equal(res.status, 200);
        const seen = backbone.requests.at(-1);
        assert.equal(seen.method, method);
        const trim = (v) => (v.length > 1 ? v.replace(/\/$/, '') : v);
        assert.equal(trim(seen.path), trim(expected));
        assert.equal(seen.headers['authorization'], 'Bearer tok-123');
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          assert.deepEqual(JSON.parse(seen.body.toString()), { a: 1 });
        }
      });
    }
  }

  it('exposes every backbone path added for the new UI features', () => {
    const all = routers.flatMap(([prefix, router]) =>
      listRoutes(router).map(({ method, path }) => `${method} ${prefix}${path === '/' ? '' : path}`)
    );
    for (const expected of [
      'DELETE /api/v1/applications/:applicationId',
      'GET /api/v1/users/alias/:alias/application/:applicationId',
      'GET /api/v1/roles/:includeInactive/:roleIds',
      'GET /api/v1/features/:includeInactive/:featureIds',
      'GET /api/v1/contacts/list/:contactIds',
      'GET /api/v1/contact-types/list/:contactTypeIds',
      'GET /api/v1/service-types/:active',
      'POST /api/v1/managed-clients/token',
      'POST /api/v1/managed-clients/introspect',
      'POST /api/v1/iam/tokens/introspect',
      'POST /api/v1/iam/permissions/check',
      'GET /api/v1/profile/image',
      'GET /api/v1/profile/image/application/:applicationId/reference',
      'POST /api/v1/report/template',
      'POST /api/v1/report/placeholdervalues',
    ]) {
      assert.ok(all.includes(expected), `missing route ${expected}`);
    }
  });

  it('does not let the generic two-segment role route shadow /roles/find/:id', async () => {
    backbone.requests.length = 0;
    await fetch(`${bff.url}/api/v1/roles/find/abc`);
    assert.equal(backbone.requests.at(-1).path, '/api/v1/roles/find/abc');
    await fetch(`${bff.url}/api/v1/roles/true/a,b`);
    assert.equal(backbone.requests.at(-1).path, '/api/v1/roles/true/a,b');
  });

  it('uploads a profile image as multipart with both session headers', async () => {
    backbone.requests.length = 0;
    const form = new FormData();
    form.append('image', new Blob(['png-bytes'], { type: 'image/png' }), 'logo.png');
    const res = await fetch(`${bff.url}/api/v1/profile/image/application/app-1`, {
      method: 'POST',
      headers: { 'session-token': 'tk' },
      body: form,
    });
    assert.equal(res.status, 200);
    const seen = backbone.requests.at(-1);
    assert.equal(seen.path, '/api/v1/profile/image/application/app-1');
    assert.equal(seen.headers['session-token'], 'tk');
    assert.match(seen.body.toString(), /name="image"; filename="logo.png"/);
  });

  it('generates a report from a template and asks for placeholders', async () => {
    backbone.requests.length = 0;
    const form = new FormData();
    form.append('documentTemplate', new Blob(['docx']), 't.docx');
    form.append('values', '{"name":"Ana"}');
    assert.equal(
      (await fetch(`${bff.url}/api/v1/report/template`, { method: 'POST', body: form })).status,
      200
    );
    const seenTemplate = backbone.requests.at(-1);
    assert.equal(seenTemplate.path, '/api/v1/report/template');
    assert.match(seenTemplate.body.toString(), /name="values"[\s\S]*application\/json/);

    const form2 = new FormData();
    form2.append('documentTemplate', new Blob(['docx']), 't.docx');
    form2.append('templateDocumentModel', '{"templateName":"t"}');
    assert.equal(
      (await fetch(`${bff.url}/api/v1/report/placeholdervalues`, { method: 'POST', body: form2 }))
        .status,
      200
    );
    assert.equal(backbone.requests.at(-1).path, '/api/v1/report/placeholdervalues');
  });

  it('forwards the audit export with page 0 and size 1000', async () => {
    backbone.requests.length = 0;
    await fetch(`${bff.url}/api/v1/iam/audit/export?eventType=LOGIN_SUCCESS&page=5`);
    const url = new URL(`http://x${backbone.requests.at(-1).url}`);
    assert.equal(url.searchParams.get('eventType'), 'LOGIN_SUCCESS');
    assert.equal(url.searchParams.get('page'), '0');
    assert.equal(url.searchParams.get('size'), '1000');
  });
});
