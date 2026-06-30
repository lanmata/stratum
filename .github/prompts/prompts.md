# Prompts — front-backbone-rest

| File | Agent | Mode | Trigger Condition |
|------|-------|------|------------------|
| `implement-feature.prompt.md` | Developer | agent | New managed entity needed end-to-end |
| `implement-component.prompt.md` | Developer | agent | New standalone UI component needed |
| `add-route.prompt.md` | Developer | agent | New page or nested feature route needed |
| `add-api-endpoint.prompt.md` | API Designer | agent | New BFF proxy route + Angular constant needed |
| `fix-bug.prompt.md` | Developer | agent | Bug report with description and reproduction steps |
| `fix-typescript-errors.prompt.md` | Developer | agent | TypeScript errors blocking build or type-check |
| `write-unit-tests.prompt.md` | Test Writer | agent | New code without tests / missing coverage |
| `review-code.prompt.md` | Code Reviewer | agent | PR opened / push to feature branch |
| `security-audit.prompt.md` | Security Reviewer | agent | Pre-release / auth change / `package.json` updated |
| `review-api-contract.prompt.md` | API Designer | agent | BFF route or `api.constants.ts` modified |
| `full-feature-delivery.prompt.md` | Orchestrator | agent | Complex multi-layer feature delivery |
| `bootstrap-web-agent-infrastructure.prompt.md` | Orchestrator | agent | Bootstrap this agent infrastructure in a new web project |
| `bootstrap-agent-infrastructure.prompt.md` | Orchestrator | agent | Bootstrap agent infrastructure in any project type |

## Input Variables

Each prompt accepts `${variableName}` substitutions. See the individual prompt files
for the full list of required inputs before invoking.
