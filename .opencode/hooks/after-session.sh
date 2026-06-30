#!/usr/bin/env sh
# Prints the pre-commit checklist after each OpenCode session.

cat <<'CHECKLIST'

════════════════════════════════════════════════════════════════
 front-backbone-rest — Pre-Commit Checklist
════════════════════════════════════════════════════════════════

 Build & Tests
 ─────────────────────────────────────────────────────────────
 [ ] npm run build:ssr
       Verifies the Angular + SSR production build succeeds.

 [ ] npm run test:headless
       Runs all Jasmine unit tests in ChromeHeadless (CI mode).

 [ ] npx tsc --noEmit
       Checks TypeScript strict-mode compliance with no output.

 Secrets & PII
 ─────────────────────────────────────────────────────────────
 [ ] Grep new files for hardcoded credentials:
       grep -rn -E "(password|secret|token)\s*=\s*['\"][^$'\"]" src/ server/

 [ ] Verify no direct localStorage access in Angular:
       grep -rn "localStorage\." src/app/ --include="*.ts"

 [ ] Confirm no console.log in Angular production code:
       grep -rn "console\.log" src/app/ --include="*.ts" --exclude="*.spec.ts"

 [ ] Confirm no console.* in BFF code:
       grep -rn "console\." server/ --include="*.js"

 Conventions
 ─────────────────────────────────────────────────────────────
 [ ] All new API paths are in src/app/shared/constants/api.constants.ts
       (no hardcoded URL strings in components or services)

 [ ] New BFF route handlers call proxyToBackbone() — no logic added

 [ ] New Angular components use standalone: true, inject(), and signals

 [ ] No *ngIf / *ngFor — use @if / @for only

 Environment Variables
 ─────────────────────────────────────────────────────────────
 [ ] If new env-vars were added, update server/config/constants.js
       with a safe default and document them in AGENTS.md §5 / §8

════════════════════════════════════════════════════════════════

CHECKLIST
