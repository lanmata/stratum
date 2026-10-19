'use strict';

require('dotenv').config();

// Allow localhost by default; set NG_ALLOWED_HOSTS in production to the real hostname.
if (!process.env['NG_ALLOWED_HOSTS']) {
  process.env['NG_ALLOWED_HOSTS'] = 'localhost';
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('node:path');
const { existsSync } = require('node:fs');

const https = require('node:https');
const { readFileSync } = require('node:fs');

const logger = require('./server/config/logger');
const { connectRedis } = require('./server/shared/redis-session-store');
const {
  PORT,
  CORS_ORIGIN,
  TRUST_PROXY,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  NODE_ENV,
  SSL_CERT_PATH,
  SSL_KEY_PATH,
} = require('./server/config/constants');

const sessionRoutes = require('./server/routes/session.routes');
const usersRoutes = require('./server/routes/users.routes');
const rolesRoutes = require('./server/routes/roles.routes');
const featuresRoutes = require('./server/routes/features.routes');
const peopleRoutes = require('./server/routes/people.routes');
const contactsRoutes = require('./server/routes/contacts.routes');
const contactTypesRoutes = require('./server/routes/contact-types.routes');
const auditRoutes = require('./server/routes/audit.routes');
const applicationsRoutes = require('./server/routes/applications.routes');
const serviceTypesRoutes = require('./server/routes/service-types.routes');
const managedClientsRoutes = require('./server/routes/managed-clients.routes');
const addressesRoutes = require('./server/routes/addresses.routes');
const identificationDocumentsRoutes = require('./server/routes/identification-documents.routes');
const noticeTypesRoutes = require('./server/routes/notice-types.routes');
const noticesRoutes = require('./server/routes/notices.routes');
const iamRoutes = require('./server/routes/iam.routes');
const profileImageRoutes = require('./server/routes/profile-image.routes');
const reportRoutes = require('./server/routes/report.routes');

const app = express();
app.disable('x-powered-by');
if (TRUST_PROXY) app.set('trust proxy', TRUST_PROXY);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Only the API is rate limited: static assets (dozens of chunks per page load) must not
// consume the quota.
app.use(
  '/api',
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ── Request logging ─────────────────────────────────────────────────────────
// API calls are logged at info/warn/error by status; static assets and pages only at debug.
// Query strings are left out on purpose.
app.use((req, res, next) => {
  const started = process.hrtime.bigint();
  const { method, path: fullPath } = req;
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    const isApi = fullPath.startsWith('/api');
    const level =
      res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : isApi ? 'info' : 'debug';
    logger.log(level, `${method} ${fullPath} ${res.statusCode} ${ms.toFixed(0)}ms`);
  });
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
app.use('/api/v1/applications', applicationsRoutes);
app.use('/api/v1/service-types', serviceTypesRoutes);
app.use('/api/v1/managed-clients', managedClientsRoutes);
app.use('/api/v1/addresses', addressesRoutes);
app.use('/api/v1/identification-documents', identificationDocumentsRoutes);
app.use('/api/v1/notice-types', noticeTypesRoutes);
app.use('/api/v1/notices', noticesRoutes);
app.use('/api/v1/iam', iamRoutes);
app.use('/api/v1/profile/image', profileImageRoutes);
app.use('/api/v1/report', reportRoutes);

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
const sslOptions = {
  key: readFileSync(SSL_KEY_PATH),
  cert: readFileSync(SSL_CERT_PATH),
};

connectRedis().finally(() => {
  https.createServer(sslOptions, app).listen(PORT, () => {
    logger.info(`front-backbone-rest BFF running on https://localhost:${PORT} [${NODE_ENV}]`);
  });
});

module.exports = app;
