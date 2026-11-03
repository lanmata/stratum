'use strict';

const express = require('express');

const router = express.Router();

/** Liveness probe: the process answers. It touches no dependency, so a backbone outage does not restart the BFF. */
router.get('/', (_req, res) => {
  res.json({ status: 'UP' });
});

module.exports = router;
