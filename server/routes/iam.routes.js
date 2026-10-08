'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.post('/tokens/introspect', (req, res) =>
  proxyToBackbone(req, res, '/api/v1/iam/tokens/introspect')
);
router.post('/permissions/check', (req, res) =>
  proxyToBackbone(req, res, '/api/v1/iam/permissions/check')
);

module.exports = router;
