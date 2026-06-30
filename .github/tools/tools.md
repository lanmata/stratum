# Tools — front-backbone-rest

| File | Command Prefix | Used By | Key Commands |
|------|---------------|---------|-------------|
| `npm.tool.md` | `npm run` | Orchestrator, Developer, Test Writer, API Designer | `dev`, `build:ssr`, `serve:ssr`, `test`, `test:headless` |
| `build.tool.md` | `npm run build:ssr` | Orchestrator, Developer, API Designer | `npm run build:ssr` (prod), `npm run watch:ssr` (dev) |
| `typescript.tool.md` | `npx tsc` | All agents | `npx tsc --noEmit` (type-check only) |
| `test-runner.tool.md` | `npm` | Orchestrator, Developer, Test Writer | `npm run test:headless` (CI), `npm test` (interactive) |
| `lint.tool.md` | `npx prettier` | Code Reviewer, Developer | `npx prettier --check "src/**/*.ts"` |
| `git.tool.md` | `git` | Orchestrator, Developer, Code Reviewer, Security Reviewer | `git diff`, `git log`, `git blame` |
| `npm-audit.tool.md` | `npm audit` | Security Reviewer, Orchestrator | `npm audit --audit-level=high --omit=dev` |
| `bundle-analyzer.tool.md` | `npm run build:ssr` | Code Reviewer, Developer | budget check via `@angular/build` production build |

## Quality Gate Command Sequence

```bash
npm run build:ssr          # 1. Production build + budget check
npm run test:headless      # 2. All Jasmine tests (headless)
npx tsc --noEmit           # 3. TypeScript strict type-check
```

All three must pass before any merge to `main`.
