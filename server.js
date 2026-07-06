'use strict';

// Allow localhost by default; set NG_ALLOWED_HOSTS in production to the real hostname.
if (!process.env['NG_ALLOWED_HOSTS']) {
  process.env['NG_ALLOWED_HOSTS'] = 'localhost';
}

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('node:path');
const { existsSync } = require('node:fs');

const logger = require('./server/config/logger');
const { PORT, CORS_ORIGIN, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, NODE_ENV } = require('./server/config/constants');

const sessionRoutes = require('./server/routes/session.routes');
const usersRoutes = require('./server/routes/users.routes');
const rolesRoutes = require('./server/routes/roles.routes');
const featuresRoutes = require('./server/routes/features.routes');
const peopleRoutes = require('./server/routes/people.routes');
const contactsRoutes = require('./server/routes/contacts.routes');
const contactTypesRoutes = require('./server/routes/contact-types.routes');
const auditRoutes = require('./server/routes/audit.routes');

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(compression());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ── Request logging ─────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ── API Routes (BFF proxy layer) ────────────────────────────────────────────
app.use('/api/v1/session', sessionRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/features', featuresRoutes);
app.use('/api/v1/people', peopleRoutes);
app.use('/api/v1/contacts', contactsRoutes);
app.use('/api/v1/contact-types', contactTypesRoutes);
app.use('/api/v1/iam/audit', auditRoutes);

// ── Angular SSR ─────────────────────────────────────────────────────────────
const distPath = path.join(__dirname, 'dist/front-backbone-rest/browser');
const ssrPath = path.join(__dirname, 'dist/front-backbone-rest/server/server.mjs');

if (existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.get('*splat', async (req, res) => {
  if (existsSync(ssrPath)) {
    try {
      const { reqHandler } = await import(ssrPath);
      reqHandler(req, res);
    } catch {
      const indexPath = path.join(distPath, 'index.html');
      if (existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(503).send('Application not built. Run: npm run build:ssr');
      }
    }
  } else {
    res.status(503).send('Application not built. Run: npm run build:ssr');
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`front-backbone-rest BFF running on http://localhost:${PORT} [${NODE_ENV}]`);
});

module.exports = app;
