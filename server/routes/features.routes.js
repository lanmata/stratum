'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.get('/:includeInactive', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/features/${req.params['includeInactive']}`)
);
router.get('/find/:featureId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/features/find/${req.params['featureId']}`)
);
router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/features/'));
router.put('/:featureId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/features/${req.params['featureId']}`)
);

module.exports = router;
