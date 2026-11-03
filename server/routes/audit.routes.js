'use strict';

const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');

const router = Router();

router.get('/events', (req, res) => proxyToBackbone(req, res, '/api/v1/iam/audit/events'));

// Fetches up to 1000 events for client-side export; delegates filtering to backbone
router.get('/export', (req, res) =>
  proxyToBackbone(req, res, '/api/v1/iam/audit/events', {
    params: { ...req.query, page: 0, size: 1000 },
  }),
);

// Usage and access reports (backbone needs the AUDIT_READ feature): aggregated numbers only.
for (const report of ['summary', 'timeseries', 'hours', 'heatmap', 'applications', 'clients']) {
  router.get(`/reports/${report}`, (req, res) =>
    proxyToBackbone(req, res, `/api/v1/iam/audit/reports/${report}`),
  );
}

module.exports = router;
