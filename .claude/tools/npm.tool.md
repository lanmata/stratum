# npm — Tool

Used by: Orchestrator, Developer, Test Writer, API Designer

## Purpose
Executes npm scripts defined in `package.json` for front-backbone-rest.

## Available Commands

### Development
```bash
npm run start          # Angular dev server only (port 4200, no BFF)
npm run dev            # Watch build + BFF concurrently (recommended for dev)
npm run watch:ssr      # Watch Angular build only (no BFF)
```

### Build
```bash
npm run build:ssr      # Angular + SSR production build → dist/front-backbone-rest/
```

### BFF Server
```bash
npm run serve:ssr      # Start Express BFF on port 4000 (requires built dist/)
npm run serve:ssr:front-backbone-rest  # Start SSR bundle directly (post-build)
```

### Testing
```bash
npm test               # Jasmine + Karma interactive (opens Chrome)
npm run test:headless  # Jasmine + Karma headless CI mode (ChromeHeadlessNoSandbox)
```

## Output Locations

| Command | Output |
|---------|--------|
| `build:ssr` | `dist/front-backbone-rest/browser/` (static assets) |
| `build:ssr` | `dist/front-backbone-rest/server/server.mjs` (SSR bundle) |
| `test:headless` | Console output; exit code 0 = all pass |

## Notes

- BFF port: `4000` (configurable via `PORT` env-var).
- Angular dev server port: `4200`.
- `npm run dev` watches and rebuilds — no pre-built dist required.
- `npm run serve:ssr` requires a pre-built `dist/` directory.
- Always use `npm` — not `pnpm` or `yarn`.
