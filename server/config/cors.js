'use strict';

/**
 * Turns the CORS_ORIGIN setting into the `origin` option of the `cors` package.
 *
 * The BFF serves the Angular app from the same origin, so cross-origin access is the exception:
 * - a comma-separated list of origins: exactly those;
 * - `*`: any origin. Refused in production, where it combined with credentials lets any site call the API;
 * - empty in production: no CORS at all (same origin only);
 * - empty in development: any origin, as before, so `ng serve` on :4200 keeps working.
 *
 * @param {string|undefined} value
 * @param {string} nodeEnv
 * @returns {false|'*'|string[]}
 * @throws {Error} when `*` is configured in production
 */
function resolveCorsOrigin(value, nodeEnv) {
  const text = (value ?? '').trim();
  const production = nodeEnv === 'production';

  if (text === '') return production ? false : '*';
  if (text === '*') {
    if (production) {
      throw new Error("CORS_ORIGIN='*' is not allowed in production: list the allowed origins, or leave it empty for same-origin only.");
    }
    return '*';
  }
  return text
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

module.exports = { resolveCorsOrigin };
