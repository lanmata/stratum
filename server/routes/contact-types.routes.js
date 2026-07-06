'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/contact-types/'));
router.get('/list-all', (req, res) => proxyToBackbone(req, res, '/api/v1/contact-types/list-all'));
router.get('/:contactTypeId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/contact-types/${req.params['contactTypeId']}`)
);
router.put('/:contactTypeId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/contact-types/${req.params['contactTypeId']}`)
);
router.delete('/:contactTypeId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/contact-types/${req.params['contactTypeId']}`)
);

module.exports = router;
