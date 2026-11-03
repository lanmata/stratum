'use strict';

const { after, before, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { startApp } = require('./helpers');
const healthRoutes = require('../routes/health.routes');

describe('GET /healthz', () => {
  let app;
  before(async () => {
    app = await startApp([['/healthz', healthRoutes]]);
  });
  after(() => app.close());

  it('answers UP without touching any dependency', async () => {
    const res = await fetch(`${app.url}/healthz`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'UP' });
  });
});
