'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

// Public — no auth required (mirrors backbone-rest public paths)
router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/session'));
router.post('/token', (req, res) => proxyToBackbone(req, res, '/api/v1/session/token'));
// validate / renew / logout read the session token from the `session-token` header, which leaves
// `Authorization` free for the application's managed client.
router.get('/validate', (req, res) =>
  proxyToBackbone(req, res, '/api/v1/session/validate', { sessionHeader: true })
);
router.get('/renew', (req, res) =>
  proxyToBackbone(req, res, '/api/v1/session/renew', { sessionHeader: true })
);
router.post('/logout', (req, res) =>
  proxyToBackbone(req, res, '/api/v1/session/logout', { sessionHeader: true })
);
router.post('/refresh', (req, res) => proxyToBackbone(req, res, '/api/v1/session/refresh'));

module.exports = router;
