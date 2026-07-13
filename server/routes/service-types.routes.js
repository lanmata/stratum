'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/service-types/'));
router.get('/list-all', (req, res) => proxyToBackbone(req, res, '/api/v1/service-types/true'));
router.get('/:serviceTypeId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/service-types/${req.params['serviceTypeId']}`)
);
router.put('/:serviceTypeId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/service-types/${req.params['serviceTypeId']}`)
);
router.delete('/:serviceTypeId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/service-types/${req.params['serviceTypeId']}`)
);

module.exports = router;
