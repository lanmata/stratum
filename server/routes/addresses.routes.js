'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/addresses'));
router.get('/person/:personId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/addresses/person/${req.params['personId']}`)
);
router.get('/:addressId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/addresses/${req.params['addressId']}`)
);
router.put('/:addressId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/addresses/${req.params['addressId']}`)
);
router.delete('/:addressId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/addresses/${req.params['addressId']}`)
);

module.exports = router;
