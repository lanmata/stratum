'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/identification-documents/'));
router.get('/list-all', (req, res) =>
  proxyToBackbone(req, res, '/api/v1/identification-documents/list-all')
);
router.get('/:identificationDocumentId', (req, res) =>
  proxyToBackbone(
    req,
    res,
    `/api/v1/identification-documents/${req.params['identificationDocumentId']}`
  )
);
router.put('/:identificationDocumentId', (req, res) =>
  proxyToBackbone(
    req,
    res,
    `/api/v1/identification-documents/${req.params['identificationDocumentId']}`
  )
);
router.delete('/:identificationDocumentId', (req, res) =>
  proxyToBackbone(
    req,
    res,
    `/api/v1/identification-documents/${req.params['identificationDocumentId']}`
  )
);

module.exports = router;
