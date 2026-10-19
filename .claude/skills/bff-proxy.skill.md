# BFF Proxy — Shared Skill

Applies to: Developer, API Designer

## `proxyToBackbone` Contract

```javascript
// server/shared/proxy.js — signature (do not modify)
async function proxyToBackbone(req, res, backendPath, overrides = {})
```

What it does automatically:
- Constructs `url = BACKBONE_BASE_URL + backendPath`
- Forwards `session-token` header from the incoming request
- Forwards `req.query` as query params
- Forwards `req.body` as JSON body for POST / PUT / PATCH
- Returns the backbone-rest response status and body directly
- On network error: returns `502 { error: 'Backend unavailable' }`

## Route File Pattern

```javascript
'use strict';
const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');
const router = Router();

// Static POST
router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/users'));

// Dynamic GET — bracket notation for params
router.get('/user/:userId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/users/user/${req.params['userId']}`)
);

// Multi-param path
router.put('/link/user/:userId/role/:roleId', (req, res) =>
  proxyToBackbone(
    req, res,
    `/api/v1/users/link/user/${req.params['userId']}/role/${req.params['roleId']}`
  )
);

module.exports = router;
```

## Logger in BFF (do not use console.*)

```javascript
// CORRECT
const logger = require('../config/logger');
logger.info(`Route /api/v1/users called`);
logger.error(`Proxy error → ${url}:`, err.message);

// FORBIDDEN
console.log(...)
```

## `server.js` Registration

```javascript
// Require at top with other route requires
const <entity>Routes = require('./server/routes/<entity>.routes');

// Mount BEFORE the Angular SSR catch-all (app.get('*splat', ...))
app.use('/api/v1/<entity>', <entity>Routes);
```

## Environment Variables

New env-vars must be added to `server/config/constants.js` with a safe default:

```javascript
module.exports = {
  BACKBONE_BASE_URL: process.env['BACKBONE_BASE_URL'] || 'http://localhost:8443',
  NEW_VAR: process.env['NEW_VAR'] || 'safe-default',
};
```

Never read `process.env` directly in route files.

## Absolute Forbidden List

- Logic (if/switch/map/filter) in route handler functions
- Accessing `req.body` or `req.query` to construct the backbone-rest path
- Calling `axios` directly in route files (use `proxyToBackbone`)
- Registering a route **after** the SSR catch-all in `server.js`
- Hardcoding `BACKBONE_BASE_URL`
