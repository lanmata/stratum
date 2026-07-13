'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/role-features'));
router.get('/role/:roleId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/role-features/role/${req.params['roleId']}`)
);
router.put('/:roleFeatureId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/role-features/${req.params['roleFeatureId']}`)
);
router.delete('/:roleFeatureId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/role-features/${req.params['roleFeatureId']}`)
);

module.exports = router;
