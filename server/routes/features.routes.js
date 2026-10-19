'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

// Paginated, filtered catalog (`q`, `active`, `page`, `size`).
router.get('/', (req, res) => proxyToBackbone(req, res, '/api/v1/features/'));
// Deprecated upstream: unbounded listing of the whole catalog.
router.get('/:includeInactive', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/features/${req.params['includeInactive']}`)
);
router.get('/find/:featureId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/features/find/${req.params['featureId']}`)
);
router.get('/role/:roleId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/features/role/${req.params['roleId']}`)
);
// Declared before the generic two-segment route so `/:featureId/roles` is not shadowed by it.
router.get('/:featureId/roles', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/features/${req.params['featureId']}/roles`)
);
router.get('/:includeInactive/:featureIds', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/features/${req.params['includeInactive']}/${req.params['featureIds']}`)
);
router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/features/'));
router.put('/:featureId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/features/${req.params['featureId']}`)
);

module.exports = router;
