'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');
const { establishSession, endSession } = require('../shared/cookie-session');

const router = Router();

// With SESSION_COOKIE the real tokens stay in the BFF: a successful login / refresh / renew stores them in the server-side session and
// answers the browser with unsigned copies; every other call gets the real token from the session. Without it (or without a cookie)
// the calls behave exactly as before.
const keepSession = (req, res) => ({
  afterResponse: (response) => (response.status === 200 ? establishSession(req, res, response.data) : response.data),
});

// Public — no auth required (mirrors backbone-rest public paths)
router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/session', keepSession(req, res)));
router.post('/token', (req, res) => proxyToBackbone(req, res, '/api/v1/session/token', keepSession(req, res)));
// validate / renew / logout read the session token from the `session-token` header, which leaves
// `Authorization` free for the application's managed client.
router.get('/validate', (req, res) =>
  proxyToBackbone(req, res, '/api/v1/session/validate', { sessionHeader: true })
);
router.get('/renew', (req, res) =>
  proxyToBackbone(req, res, '/api/v1/session/renew', { sessionHeader: true, ...keepSession(req, res) })
);
router.post('/logout', (req, res) => {
  const refreshToken = req.stratumSession?.tokens?.refreshToken;
  return proxyToBackbone(req, res, '/api/v1/session/logout', {
    sessionHeader: true,
    ...(refreshToken ? { data: { ...req.body, refreshToken } } : {}),
    // The server-side session ends whatever backbone answered, and the cookie is cleared before the response goes out.
    afterResponse: async (response) => {
      await endSession(req, res);
      return response.data;
    },
  });
});
router.post('/refresh', (req, res) => {
  const refreshToken = req.stratumSession?.tokens?.refreshToken;
  return proxyToBackbone(req, res, '/api/v1/session/refresh', {
    ...(refreshToken ? { data: { ...req.body, refreshToken } } : {}),
    ...keepSession(req, res),
  });
});

module.exports = router;
