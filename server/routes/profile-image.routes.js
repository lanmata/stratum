'use strict';

const { Router } = require('express');
const { proxyToBackbone, proxyMultipart } = require('../shared/proxy');
const { handleUpload } = require('../shared/upload');

const router = Router();

router.post(
  '/application/:applicationId',
  handleUpload((m) => m.single('image')),
  (req, res) =>
    proxyMultipart(req, res, `/api/v1/profile/image/application/${req.params['applicationId']}`, {
      sessionHeader: true,
    })
);
router.get('/application/:applicationId/reference', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/profile/image/application/${req.params['applicationId']}/reference`, {
    sessionHeader: true,
  })
);
router.get('/', (req, res) =>
  proxyToBackbone(req, res, '/api/v1/profile/image/', {
    responseType: 'arraybuffer',
    sessionHeader: true,
  })
);

module.exports = router;
