'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

// The whole catalog is never listed: GET / is a paginated search and a feature is otherwise reached
// through the roles it is linked to.
router.get('/', (req, res) => proxyToBackbone(req, res, '/api/v1/features/'));
router.get('/find/:featureId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/features/find/${req.params['featureId']}`)
);
router.get('/role/:roleId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/features/role/${req.params['roleId']}`)
);
router.get('/:featureId/roles', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/features/${req.params['featureId']}/roles`)
);
router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/features/'));
router.put('/:featureId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/features/${req.params['featureId']}`)
);

module.exports = router;
