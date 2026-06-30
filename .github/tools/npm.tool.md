---
name: npm
description: Tool for running all npm scripts in front-backbone-rest (build, dev, serve, test)
type: terminal
command-prefix: npm run
used-by: [Orchestrator, Developer, Test Writer, API Designer]
---

# npm

## Purpose
Executes the npm scripts defined in `package.json`. Used by every agent that needs
to build, serve, or test front-backbone-rest.

## Available Commands

### Development
```bash
# Angular dev server only (port 4200, no BFF)
npm run start

# Watch build + BFF concurrently (recommended for dev)
npm run dev

# Watch Angular build only (no BFF)
npm run watch:ssr
```

### Build
```bash
# Angular + SSR production build → dist/front-backbone-rest/
npm run build:ssr
```

### BFF Server
```bash
# Start Express BFF on port 4000 (requires built dist/)
npm run serve:ssr

# Start SSR bundle directly (post-build)
npm run serve:ssr:front-backbone-rest
```

### Testing
```bash
# Jasmine + Karma interactive (opens Chrome)
npm test

# Jasmine + Karma headless CI mode (ChromeHeadlessNoSandbox)
npm run test:headless
```

## Output Locations

| Command | Output |
|---------|--------|
| `build:ssr` | `dist/front-backbone-rest/browser/` (static assets) |
| `build:ssr` | `dist/front-backbone-rest/server/server.mjs` (SSR bundle) |
| `test` / `test:headless` | Console output + `coverage/` (if configured) |

## Notes

- BFF runs on port `4000` (configurable via `PORT` env-var).
- Angular dev server runs on port `4200`.
- `npm run dev` requires no pre-built dist — it watches and rebuilds.
- `npm run serve:ssr` requires a pre-built `dist/` directory.
- Package manager is npm — do not use `pnpm` or `yarn` with this project.
