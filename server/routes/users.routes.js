'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/users'));
router.get('/user/:userId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/users/user/${req.params['userId']}`)
);
router.get('/application/:applicationId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/users/application/${req.params['applicationId']}`)
);
router.get('/check/alias/:alias/application/:applicationId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/users/check/alias/${req.params['alias']}/application/${req.params['applicationId']}`)
);
router.get('/check/email/:email/application/:applicationId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/users/check/email/${req.params['email']}/application/${req.params['applicationId']}`)
);
router.get('/userByAlias/:alias/application/:applicationId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/users/userByAlias/${req.params['alias']}/application/${req.params['applicationId']}`)
);
router.put('/:userId/full-detail', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/users/${req.params['userId']}/full-detail`)
);
router.put('/:userId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/users/${req.params['userId']}`)
);
router.put('/link/user/:userId/role/:roleId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/users/link/user/${req.params['userId']}/role/${req.params['roleId']}`)
);
router.put('/unlink/user/:userId/role/:roleId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/users/unlink/user/${req.params['userId']}/role/${req.params['roleId']}`)
);
router.delete('/application/:applicationId/user/:userId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/users/application/${req.params['applicationId']}/user/${req.params['userId']}`)
);

module.exports = router;
