# Tools

| File | Command prefix | Used by | Key commands |
|------|---------------|---------|-------------|
| `tools/npm.tool.md` | `npm run` | All agents | `build:ssr`, `test:headless`, `dev`, `serve:ssr` |
| `tools/typescript.tool.md` | `npx tsc` | All agents | `--noEmit`, `--project tsconfig.spec.json` |
| `tools/test-runner.tool.md` | `npm` | Orchestrator, Developer, Test Writer | `test`, `test:headless` |
| `tools/build.tool.md` | `npm run build:ssr` | Orchestrator, Developer, API Designer | `build:ssr`, `watch:ssr` |
| `tools/git.tool.md` | `git` | Orchestrator, Developer, Code Reviewer, Security Reviewer | `diff`, `log`, `blame` |
| `tools/npm-audit.tool.md` | `npm audit` | Security Reviewer, Orchestrator | `--audit-level=high --omit=dev` |
