---
name: Orchestrator Skills
description: Delegation patterns and quality-gate sequence for multi-layer feature delivery in front-backbone-rest
applies-to: [Orchestrator]
---

# Orchestrator — Skill Definition

## 1. Decomposition Pattern

For every user request, classify it before acting:

| Request type | Agents to delegate (in order) |
|-------------|-------------------------------|
| New entity end-to-end | api-designer → developer → test-writer → code-reviewer |
| New UI component only | developer → test-writer → code-reviewer |
| Bug fix | developer → test-writer → code-reviewer |
| Security concern | security-reviewer (read-only, no other agent) |
| BFF route only | api-designer → code-reviewer |
| Tests only | test-writer |

## 2. Delegation Protocol

1. State the full plan to the user before delegating anything.
2. Delegate one agent at a time, in order. Wait for each to finish.
3. Pass explicit context to each subagent — do not assume it inherits your state.
4. If a subagent reports a failure, fix the root cause before proceeding to the next step.

## 3. Quality Gate Sequence

Run after ALL subtasks complete, before issuing the final report:

```bash
npm run build:ssr          # Angular + SSR production build
npm run test:headless      # Jasmine unit tests in ChromeHeadless
npx tsc --noEmit           # TypeScript strict type-check
```

All three must pass. If any fails, delegate the fix to `developer` before reporting done.

## 4. Context to Pass Each Agent

**api-designer**: entity name, backbone-rest base path, list of HTTP methods needed.

**developer**: entity name, service file path, API constant block, component selector and feature path.

**test-writer**: service file path(s) and component path(s) just created or modified.

**code-reviewer**: list of all files modified in this session.

**security-reviewer**: trigger condition (auth change / `package.json` change / explicit request).

## 5. Key File Paths

| Role | Key paths |
|------|-----------|
| API constants | `src/app/shared/constants/api.constants.ts` |
| Models | `src/app/shared/models/<entity>.model.ts` |
| Services | `src/app/core/services/<entity>.service.ts` |
| BFF routes | `server/routes/<entity>.routes.js` |
| BFF entry | `server.js` |
| App routes | `src/app/app.routes.ts` |
| Feature routes | `src/app/features/<entity>/<entity>.routes.ts` |

## 6. Constraints

- Never implement code directly — always delegate to a specialised agent.
- Never skip the quality gate.
- Never report success if `npm run build:ssr` or `npm run test:headless` has not run.

## 7. Quality Checklist

- [ ] Plan stated to user before delegation
- [ ] Agents delegated in correct layer order
- [ ] Quality gate passed: build ✓ tests ✓ type-check ✓
- [ ] Delivery report produced with file list and status
