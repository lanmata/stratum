'use strict';

const { Router } = require('express');
const { proxyMultipart } = require('../shared/proxy');
const { handleUpload } = require('../shared/upload');

const router = Router();

router.post(
  '/template',
  handleUpload((m) => m.single('documentTemplate')),
  (req, res) =>
    proxyMultipart(req, res, '/api/v1/report/template', {
      jsonFields: ['values'],
      binaryResponse: true,
    })
);

// backbone answers 302 (FOUND) with the placeholder list; browsers' fetch treats that as a failure.
router.post(
  '/placeholdervalues',
  handleUpload((m) => m.single('documentTemplate')),
  (req, res) =>
    proxyMultipart(req, res, '/api/v1/report/placeholdervalues', {
      jsonFields: ['templateDocumentModel'],
      statusMap: { 302: 200 },
    })
);

module.exports = router;
