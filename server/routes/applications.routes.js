'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.get('/', (req, res) => proxyToBackbone(req, res, '/api/v1/applications'));
router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/applications'));
router.get('/:applicationId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/applications/${req.params['applicationId']}`)
);
router.put('/:applicationId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/applications/${req.params['applicationId']}`)
);
router.delete('/:applicationId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/applications/${req.params['applicationId']}`)
);

module.exports = router;
