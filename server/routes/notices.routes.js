'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/notices'));
router.get('/application/:applicationId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/notices/application/${req.params['applicationId']}`)
);
router.get('/:noticeId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/notices/${req.params['noticeId']}`)
);
router.put('/:noticeId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/notices/${req.params['noticeId']}`)
);
router.delete('/:noticeId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/notices/${req.params['noticeId']}`)
);

module.exports = router;
