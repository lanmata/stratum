'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/notice-types/'));
router.get('/list-all', (req, res) => proxyToBackbone(req, res, '/api/v1/notice-types/list-all'));
router.get('/:noticeTypeId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/notice-types/${req.params['noticeTypeId']}`)
);
router.put('/:noticeTypeId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/notice-types/${req.params['noticeTypeId']}`)
);
router.delete('/:noticeTypeId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/notice-types/${req.params['noticeTypeId']}`)
);

module.exports = router;
