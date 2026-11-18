'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The external accounts linked to a user: `/api/v1/users/:userId/federated-identities` (list and unlink). */
const router = Router({ mergeParams: true });

router.use((req, res, next) => (UUID.test(req.params.userId) ? next() : res.status(400).json({ error: 'Invalid userId' })));
router.get('/', (req, res) => proxyToBackbone(req, res, `/api/v1/users/${req.params.userId}/federated-identities`));
router.delete('/:identityId', (req, res) =>
  UUID.test(req.params.identityId)
    ? proxyToBackbone(req, res, `/api/v1/users/${req.params.userId}/federated-identities/${req.params.identityId}`)
    : res.status(400).json({ error: 'Invalid identityId' }),
);

module.exports = router;
