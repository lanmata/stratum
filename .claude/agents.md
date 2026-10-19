# Agents

| File | Agent | User-invocable | Role |
|------|-------|---------------|------|
| `agents/orchestrator.md` | Orchestrator | Yes | Decomposes multi-step requests, delegates to subagents, runs quality gate |
| `agents/developer.md` | Developer | Yes | Implements Angular components, services, BFF routes, app routes |
| `agents/test-writer.md` | Test Writer | Yes | Writes Jasmine/Karma unit tests for components and services |
| `agents/api-designer.md` | API Designer | Yes | Creates BFF Express routes and Angular API path constants |
| `agents/code-reviewer.md` | Code Reviewer | No (subagent only) | Read-only convention and TypeScript review |
| `agents/security-reviewer.md` | Security Reviewer | No (subagent only) | Read-only OWASP Top-10 audit |
