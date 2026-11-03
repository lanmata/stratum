'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createSessionStore } = require('../shared/session-store');
const { parseCookies, stripSignature, tokenTtlSeconds, cookieSession } = require('../shared/cookie-session');

describe('session store', () => {
  it('creates, reads, replaces and removes a session in memory', async () => {
    let now = 1_000_000;
    const store = createSessionStore({ now: () => now });
    const id = await store.create({ token: 'a' }, 60);

    assert.match(id, /^[\w-]{40,}$/);
    assert.deepEqual(await store.get(id), { token: 'a' });
    await store.put(id, { token: 'b' }, 60);
    assert.deepEqual(await store.get(id), { token: 'b' });
    await store.remove(id);
    assert.equal(await store.get(id), null);
    assert.equal(await store.get(''), null);
    assert.equal(await store.get('x'.repeat(200)), null);
    now += 0;
  });

  it('forgets a session when its time is up', async () => {
    let now = 0;
    const store = createSessionStore({ now: () => now });
    const id = await store.create({ token: 'a' }, 10);

    now = 9_000;
    assert.ok(await store.get(id));
    now = 10_001;
    assert.equal(await store.get(id), null);
  });

  it('uses Redis when it is there and falls back to memory when it fails', async () => {
    const data = new Map();
    const redis = { set: async (k, v) => data.set(k, v), get: async (k) => data.get(k) ?? null, del: async (k) => data.delete(k) };
    const store = createSessionStore({ getRedis: async () => redis });
    const id = await store.create({ token: 'r' }, 60);
    assert.ok([...data.keys()][0].startsWith('stratum:sess:'));
    assert.deepEqual(await store.get(id), { token: 'r' });
    await store.remove(id);
    assert.equal(data.size, 0);

    const broken = { set: async () => { throw new Error('down'); }, get: async () => { throw new Error('down'); }, del: async () => { throw new Error('down'); } };
    const fallback = createSessionStore({ getRedis: async () => broken });
    const id2 = await fallback.create({ token: 'm' }, 60);
    assert.deepEqual(await fallback.get(id2), { token: 'm' });
    await fallback.remove(id2);
    assert.equal(await fallback.get(id2), null);

    const noRedis = createSessionStore({ getRedis: async () => { throw new Error('boom'); } });
    assert.deepEqual(await noRedis.get(await noRedis.create({ token: 'z' }, 5)), { token: 'z' });
  });
});

describe('cookie session helpers', () => {
  it('parses cookies', () => {
    assert.deepEqual(parseCookies('a=1; b=two%20words; bad; c='), { a: '1', b: 'two words', c: '' });
    assert.deepEqual(parseCookies(undefined), {});
  });

  it('strips the signature of a JWT and leaves anything else alone', () => {
    assert.equal(stripSignature('h.p.sig'), 'h.p.');
    assert.equal(stripSignature('nodots'), 'nodots');
    assert.equal(stripSignature(undefined), undefined);
  });

  it('takes the lifetime from the exp claim, capped, and falls back to the cap', () => {
    const jwt = (exp) => `h.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.s`;
    assert.equal(tokenTtlSeconds(jwt(1100), 3600, 1_000_000), 100);
    assert.equal(tokenTtlSeconds(jwt(9999999), 3600, 1_000_000), 3600);
    assert.equal(tokenTtlSeconds(jwt(10), 3600, 1_000_000), 1);
    assert.equal(tokenTtlSeconds('not-a-jwt', 777), 777);
    assert.equal(tokenTtlSeconds(`h.${Buffer.from('{}').toString('base64url')}.s`, 555), 555);
  });

  it('does nothing when the feature is off', async () => {
    let called = false;
    await cookieSession({ enabled: false })({ headers: {} }, {}, () => { called = true; });
    assert.ok(called);
  });
});
