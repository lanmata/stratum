'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/notices'));
router.get('/application/:applicationId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/notices/application/${req.params['applicationId']}`)
);
router.delete('/user/:userId/application/:applicationId/notice-type/:noticeTypeId', (req, res) =>
  proxyToBackbone(
    req,
    res,
    `/api/v1/notices/user/${req.params['userId']}/application/${req.params['applicationId']}/notice-type/${req.params['noticeTypeId']}`
  )
);

module.exports = router;
