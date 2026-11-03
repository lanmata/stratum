'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveCorsOrigin } = require('../config/cors');

describe('resolveCorsOrigin', () => {
  it('lists the configured origins, trimmed, in any environment', () => {
    assert.deepEqual(resolveCorsOrigin('https://a.test, https://b.test ,', 'production'), ['https://a.test', 'https://b.test']);
    assert.deepEqual(resolveCorsOrigin('http://localhost:4200', 'development'), ['http://localhost:4200']);
  });

  it('allows any origin in development when nothing is configured, as before', () => {
    assert.equal(resolveCorsOrigin(undefined, 'development'), '*');
    assert.equal(resolveCorsOrigin('   ', 'development'), '*');
    assert.equal(resolveCorsOrigin('*', 'development'), '*');
  });

  it('turns CORS off in production when nothing is configured (same origin only)', () => {
    assert.equal(resolveCorsOrigin(undefined, 'production'), false);
    assert.equal(resolveCorsOrigin('', 'production'), false);
  });

  it("refuses '*' in production", () => {
    assert.throws(() => resolveCorsOrigin('*', 'production'), /not allowed in production/);
  });
});
