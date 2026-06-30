# Agents — front-backbone-rest

| File | Agent | User-Invocable | Subagent-Only | Purpose |
|------|-------|---------------|--------------|---------|
| `orchestrator.agent.md` | Orchestrator | ✓ | — | Decomposes multi-step requests; delegates to all other agents |
| `developer.agent.md` | Developer | ✓ | — | Implements Angular components, services, and BFF proxy routes |
| `test-writer.agent.md` | Test Writer | ✓ | — | Writes Jasmine + Karma unit tests for components and services |
| `code-reviewer.agent.md` | Code Reviewer | — | ✓ | Read-only convention check and TypeScript diff review |
| `security-reviewer.agent.md` | Security Reviewer | — | ✓ | OWASP Top-10 audit, secrets scan, CVE review |
| `api-designer.agent.md` | API Designer | ✓ | — | BFF proxy routes and Angular API constant design |

## Invocation

User-invocable agents can be triggered directly by the developer.
Subagent-only agents are invoked by the Orchestrator or by hook triggers.

## Skill Definitions

Each agent's skill definition is at `.github/skills/<agent-name>/SKILL.md`.
Shared skills used by multiple agents are at `.github/skills/<name>.skill.md`.

See `.github/skills/skills.md` for the full skills index.
