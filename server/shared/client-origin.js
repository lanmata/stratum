'use strict';

const MAX_USER_AGENT_LENGTH = 512;

/** The address Express resolved for the caller, without the IPv4-in-IPv6 prefix. */
function clientIp(req) {
  const ip = req.ip ?? req.socket?.remoteAddress ?? '';
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

/**
 * Headers that tell backbone-rest who the person behind this request is. Without them backbone only sees the BFF's own
 * address and user agent, so its audit trail cannot say which device or browser people use.
 *
 * `X-Forwarded-For` is always overwritten with the address Express resolved (it honours TRUST_PROXY), never copied from
 * the caller, so a client cannot choose what is recorded. Backbone honours both headers only from the proxies listed in
 * its `umdc.audit.trusted-proxies`.
 *
 * @param {import('express').Request} req
 * @returns {Record<string, string>}
 */
function clientOriginHeaders(req) {
  const headers = {};
  const ip = clientIp(req);
  if (ip) headers['X-Forwarded-For'] = ip;
  const userAgent = req.headers?.['user-agent'];
  if (userAgent) headers['X-Forwarded-User-Agent'] = String(userAgent).slice(0, MAX_USER_AGENT_LENGTH);
  return headers;
}

module.exports = { clientOriginHeaders, clientIp, MAX_USER_AGENT_LENGTH };
