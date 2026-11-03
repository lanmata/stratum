'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { clientOriginHeaders, clientIp, MAX_USER_AGENT_LENGTH } = require('../shared/client-origin');

describe('clientOriginHeaders', () => {
  it('sends the resolved address and the person\'s user agent', () => {
    const headers = clientOriginHeaders({ ip: '203.0.113.5', headers: { 'user-agent': 'Mozilla/5.0 Safari' } });
    assert.deepEqual(headers, { 'X-Forwarded-For': '203.0.113.5', 'X-Forwarded-User-Agent': 'Mozilla/5.0 Safari' });
  });

  it('never copies a caller-supplied X-Forwarded-For', () => {
    const headers = clientOriginHeaders({ ip: '203.0.113.5', headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' } });
    assert.equal(headers['X-Forwarded-For'], '203.0.113.5');
  });

  it('strips the IPv4-in-IPv6 prefix and falls back to the socket address', () => {
    assert.equal(clientIp({ ip: '::ffff:10.0.0.7' }), '10.0.0.7');
    assert.equal(clientIp({ socket: { remoteAddress: '::ffff:10.0.0.8' } }), '10.0.0.8');
    assert.equal(clientIp({ ip: '2001:db8::1' }), '2001:db8::1');
    assert.equal(clientIp({}), '');
  });

  it('omits what it does not know', () => {
    assert.deepEqual(clientOriginHeaders({ headers: {} }), {});
    assert.deepEqual(clientOriginHeaders({}), {});
  });

  it('cuts a very long user agent to the length backbone stores', () => {
    const headers = clientOriginHeaders({ ip: '1.2.3.4', headers: { 'user-agent': 'x'.repeat(2000) } });
    assert.equal(headers['X-Forwarded-User-Agent'].length, MAX_USER_AGENT_LENGTH);
  });
});
