'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.get('/:includeInactive', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/roles/${req.params['includeInactive']}`)
);
router.get('/find/:roleId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/roles/find/${req.params['roleId']}`)
);
router.get('/user/:userId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/roles/user/${req.params['userId']}`)
);
router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/roles/'));
router.put('/:roleId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/roles/${req.params['roleId']}`)
);

module.exports = router;
