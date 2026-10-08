'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.get('/', (req, res) => proxyToBackbone(req, res, '/api/v1/managed-clients'));
router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/managed-clients'));
router.post('/token', (req, res) => proxyToBackbone(req, res, '/api/v1/managed-clients/token'));
router.post('/introspect', (req, res) =>
  proxyToBackbone(req, res, '/api/v1/managed-clients/introspect')
);
router.get('/:clientId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/managed-clients/${req.params['clientId']}`)
);
router.put('/:clientId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/managed-clients/${req.params['clientId']}`)
);
router.delete('/:clientId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/managed-clients/${req.params['clientId']}`)
);
router.post('/:clientId/rotate-secret', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/managed-clients/${req.params['clientId']}/rotate-secret`)
);
router.delete('/:clientId/tokens', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/managed-clients/${req.params['clientId']}/tokens`)
);

module.exports = router;
