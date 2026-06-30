'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

// Public — no auth required (mirrors backbone-rest public paths)
router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/session'));
router.post('/token', (req, res) => proxyToBackbone(req, res, '/api/v1/session/token'));
router.get('/validate', (req, res) => proxyToBackbone(req, res, '/api/v1/session/validate'));
router.get('/renew', (req, res) => proxyToBackbone(req, res, '/api/v1/session/renew'));
router.post('/refresh', (req, res) => proxyToBackbone(req, res, '/api/v1/session/refresh'));

module.exports = router;
