'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/contacts/'));
router.get('/list-all', (req, res) => proxyToBackbone(req, res, '/api/v1/contacts/list-all'));
router.get('/person/:personId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/contacts/person/${req.params['personId']}`)
);
router.get('/:contactId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/contacts/${req.params['contactId']}`)
);
router.put('/:contactId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/contacts/${req.params['contactId']}`)
);
router.delete('/:contactId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/contacts/${req.params['contactId']}`)
);

module.exports = router;
