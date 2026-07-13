'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/application-role-user'));
router.get('/application/:applicationId', (req, res) =>
  proxyToBackbone(
    req,
    res,
    `/api/v1/application-role-user/application/${req.params['applicationId']}`
  )
);
router.get('/user/:userId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/application-role-user/user/${req.params['userId']}`)
);
router.put('/:applicationRoleUserId', (req, res) =>
  proxyToBackbone(
    req,
    res,
    `/api/v1/application-role-user/${req.params['applicationRoleUserId']}`
  )
);
router.delete('/:applicationRoleUserId', (req, res) =>
  proxyToBackbone(
    req,
    res,
    `/api/v1/application-role-user/${req.params['applicationRoleUserId']}`
  )
);

module.exports = router;
