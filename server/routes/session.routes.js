'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

// backbone-rest's session endpoints are public: the credentials, the refresh token or the session token itself are the
// proof. None of them gets `Authorization: Bearer <session token>`: backbone's filter rejects an expired Bearer with 401
// before the endpoint runs (so a refresh after expiry could never succeed), and on these endpoints `Authorization` is
// reserved for an application client.
const CREDENTIALS = { bearer: false };
// The session token travels in its own header (`session-token`), which is what backbone reads on these three.
const SESSION_TOKEN = { bearer: false, sessionHeader: true };

router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/session', CREDENTIALS));
router.post('/token', (req, res) => proxyToBackbone(req, res, '/api/v1/session/token', CREDENTIALS));
router.post('/refresh', (req, res) => proxyToBackbone(req, res, '/api/v1/session/refresh', CREDENTIALS));
router.get('/validate', (req, res) => proxyToBackbone(req, res, '/api/v1/session/validate', SESSION_TOKEN));
router.get('/renew', (req, res) => proxyToBackbone(req, res, '/api/v1/session/renew', SESSION_TOKEN));
// Revokes the session token (and the refresh token of the body) in backbone's deny-list.
router.post('/logout', (req, res) => proxyToBackbone(req, res, '/api/v1/session/logout', SESSION_TOKEN));

module.exports = router;
