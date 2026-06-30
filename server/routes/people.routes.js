'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/people/'));
router.get('/', (req, res) => proxyToBackbone(req, res, '/api/v1/people'));
router.get('/:personId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/people/${req.params['personId']}`)
);
router.put('/:personId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/people/${req.params['personId']}`)
);

module.exports = router;
