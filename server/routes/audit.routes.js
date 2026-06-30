'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.get('/events', (req, res) => proxyToBackbone(req, res, '/api/v1/iam/audit/events'));

module.exports = router;
