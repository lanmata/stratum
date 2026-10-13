'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

// Contacts are never listed across applications: GET / is the per-application directory
// (backbone answers 400 without applicationId) and the other listings are scoped to a subject.
router.get('/', (req, res) => proxyToBackbone(req, res, '/api/v1/contacts/'));
router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/contacts/'));
router.get('/owner/:ownerType/:ownerId', (req, res) =>
  proxyToBackbone(
    req,
    res,
    `/api/v1/contacts/owner/${req.params['ownerType']}/${req.params['ownerId']}`
  )
);
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
