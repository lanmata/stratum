'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Administration of the identity providers of an application (backbone feature FEDERATION_ADMIN, decided by backbone with the
 * administrator's session). Mounted at `/api/v1/federation/admin`: ONLY these paths are exposed; the public sign-in endpoints
 * of backbone (`authorize`, `callback`) are reached through the `/bff/federation` flow, never from the browser.
 * The secret of a provider is never part of the contract: only the name of the property that holds it (`clientSecretRef`).
 */
const router = Router();

router.param('id', (_req, res, next, value) => (UUID.test(value) ? next() : res.status(400).json({ error: 'Invalid id' })));

router.get('/providers', (req, res) => proxyToBackbone(req, res, '/api/v1/federation/admin/providers'));
router.post('/providers', (req, res) => proxyToBackbone(req, res, '/api/v1/federation/admin/providers'));
router.get('/providers/:id', (req, res) => proxyToBackbone(req, res, `/api/v1/federation/admin/providers/${req.params.id}`));
router.put('/providers/:id', (req, res) => proxyToBackbone(req, res, `/api/v1/federation/admin/providers/${req.params.id}`));
router.delete('/providers/:id', (req, res) => proxyToBackbone(req, res, `/api/v1/federation/admin/providers/${req.params.id}`));

module.exports = router;
