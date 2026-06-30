# OpenCode Complete Setup Generator

You are a senior software architect. Your task is to generate a complete, production-ready
OpenCode configuration for the project in the current working directory.

**Read the codebase before generating anything.** Every pattern, package name, class name,
convention, and tool must be derived from what actually exists in the code — not from
generic templates. If a pattern does not appear in the source, do not invent it.

---

## Step 1 — Analyze the project (do this first, generate nothing yet)

Read and record the following. You will use this information to fill every artifact below.

1. **Runtime & framework** — language version, framework + version (e.g., Java 21 / Spring Boot 4.1.0, Node 22 / Angular 22, Python 3.12 / FastAPI 0.111).
2. **Build tool** — Maven, Gradle, npm, pnpm, poetry, etc. Exact commands to compile, test, lint, and generate coverage.
3. **Package / module structure** — root package or namespace, one-line purpose per top-level module or package.
4. **Layer boundaries** — how the codebase is structured (e.g., controller → service → repository, or route → handler → use-case → adapter).
5. **Persistence** — databases in use (SQL, NoSQL, cache), ORM or query strategy, migration tool and naming convention.
6. **Messaging / events** — brokers (Kafka, RabbitMQ, SQS, NATS), listener pattern, producer pattern.
7. **External services** — Feign / OpenFeign clients, HTTP clients, third-party SDKs.
8. **Auth / security** — JWT, session tokens, OAuth, how the token is extracted in controllers.
9. **Configuration management** — where secrets come from (Vault, AWS SSM, env-vars, `.env`).
10. **Static analysis** — linting and static analysis tools configured (PMD, Checkstyle, ESLint, mypy, etc.) and what phases they run in.
11. **Test framework** — testing libraries, coverage enforcer (JaCoCo, Istanbul, coverage.py), enforced thresholds.
12. **Logging pattern** — logger naming convention, structured log format (key=value, JSON), PII rules.
13. **Key conventions** — naming rules, constructor injection vs DI framework, comment rules, any project-specific patterns that differ from framework defaults.
14. **CI/CD** — GitHub Actions, GitLab CI, Jenkins. Relevant workflow file locations.

Do not proceed to Step 2 until you have recorded answers for all 14 points.

---

## Step 2 — Generate the following artifacts

Generate all files in the order listed. After each file, state which file was written and move to the next.

### A. `.opencode/config.jsonc`

The top-level OpenCode configuration. Include:

- `project_name`, `description`, `tech_stack` (array, derived from Step 1).
- `agent` — the name of the primary development agent (usually `"developer"`).
- `agents` section — one entry per agent file, each with `description` and `file` path.
  Generate agents for every distinct role that exists in this project. Minimum set:
  `developer`, `reviewer`, `tester`. Add `database`, `devops`, `security`, `api` only if
  those concerns exist and are non-trivial in this codebase.
- `skills` section — one entry per skill file.
- `mcp.servers` array — see MCP tier rules below.
- `hooks` section — `before_edit` and `after_session`.
- `keybindings` — one per agent, `ctrl+shift+<letter>` mapping.

**MCP tier rules:**

Tier 1 (always include if applicable):
- `codegraph` (`npx -y @opencode-ai/plugin codegraph`) — symbol index and call graph; always include.
- `jetbrains` (`npx -y @jetbrains/mcp-proxy`) — include if the project uses IntelliJ / WebStorm / GoLand.
- One MCP server per primary database (postgres, mysql, sqlite, mongodb). Use a shell wrapper
  script at `.opencode/tools/<db>-mcp.sh` that reads credentials from env-vars and fails
  explicitly if any required var is missing. Never hardcode credentials in `config.jsonc`.
- `git` (`npx -y @modelcontextprotocol/server-git --repository .`) — always include.
- `github` (`npx -y @modelcontextprotocol/server-github`) — include if the project uses GitHub.

Tier 2 (include if there is clear value for this project):
- `fetch` — if agents need to read external documentation inline.
- `docker` (`npx -y mcp-server-docker`) — if the project has a docker-compose for local dev.
- `memory` (`npx -y @modelcontextprotocol/server-memory`) — if cross-session context is valuable.
- `filesystem` — if agents need broad file-system access beyond the repo root.

For each MCP server entry, add a comment block explaining: what it does, which agents use it,
what env-vars or credentials it requires, and any setup step the developer must do.

---

### B. `.opencode/AGENTS.md`

A single reference document loaded into every agent's context. Organized in numbered sections:

1. **Runtime & stack** — language, framework, build tool, key library versions.
2. **Architecture** — ASCII diagram of the request/event flow (controller → service → ... → external). One diagram covering the happy path.
3. **Package / module map** — table: package/directory | purpose. Derived from Step 1.
4. **Messaging** — topic names, consumer group names, listener class names. Skip if not applicable.
5. **Persistence** — databases, ORM, migration tool, naming convention for migrations.
6. **Key conventions** — bullet list of project-specific rules that differ from framework defaults. Include: logger naming, injection style, naming suffixes, null-check idioms, async pattern.
7. **Build & test commands** — exact commands from Step 1 for compile, test, single-test, coverage, lint.
8. **External dependencies** — private libraries or registries that require credential setup; Feign/HTTP clients and their base URLs.
9. **Agents** — table listing each agent: name | purpose | mode | model | key MCPs. Add a separate keybindings table.
10. **MCPs** — Tier 1 table and Tier 2 table, each with: name | purpose | required env-vars. Add a section on usage patterns per agent role.
11. **Skills** — index table (skill name | trigger phrase | purpose) + full prompt template for each skill inline.
12. **Hooks** — table (hook | trigger | what it does) + what each hook detects in `before_edit` + full checklist from `after_session`.
13. **Tools** — table (wrapper script | MCP it wraps | required env-vars) + template for adding a new wrapper.

Write in English. Use concise sentences. Do not repeat content from other sections — cross-reference instead.

---

### C. Agent files (`.opencode/agents/<name>.md`)

One file per agent. Each file must have YAML frontmatter followed by the agent prompt body.

**Frontmatter schema (exactly five fields — no more, no less):**
```yaml
---
description: "<one-line summary of the agent's role>"
mode: primary   # or: subagent
model: <model-id>   # e.g., claude-opus-4-8, ollama/devstral-small-2505:latest
temperature: 0.2
permissions:
  read: allow
  edit: allow   # or deny for read-only agents
  bash: ask     # or allow / deny
  glob: allow
  grep: allow
---
```

> **Critical:** Do NOT add a `tools:` field to agent frontmatter. OpenCode's schema
> requires `tools` to be an object if present; a YAML sequence (array) is invalid and
> will cause a configuration error that silently breaks the agent. MCP assignments are
> expressed in the agent body text and in AGENTS.md §10 — not in frontmatter.

**Required agents and their contracts:**

**`developer.md`** (mode: primary)
- State the agent's role in one sentence.
- "Before writing any code" checklist — steps the agent must take (read the file, check callers, etc.) before editing.
- Layer contract table — for each layer: package path, key rule or invariant.
- Code patterns section — one runnable code snippet per layer that this project actually uses.
  Derive snippets from real files you read in Step 1, not from framework documentation.
  Snippets must show: correct class structure, injection style, logger naming, method signatures.
- Logging section — correct and incorrect examples from this codebase.
- Secrets section — correct (`@Value("${...}")` or env-var) vs incorrect (hardcoded) examples.
- End-of-task checklist — commands to run before closing the task.

**`reviewer.md`** (mode: subagent, edit: deny, bash: deny)
- Review flow — numbered steps (diff → impact analysis → checklist → CI check → report).
- Checklist organized by concern: correctness, exception mapping, conventions, static analysis rules, security (OWASP Top-10 for this stack), performance, test coverage.
- Exception → HTTP status table derived from the real exception handler in this codebase.
- Static analysis rules table — derived from the actual ruleset file (PMD, ESLint config, etc.).
  List the rules most frequently violated in this type of codebase and what to look for.
- Report format — Crítico / Importante / Sugerencia with file:line references.

**`tester.md`** (mode: subagent)
- "Before writing tests" checklist.
- Framework table — test library | version | primary use.
- Code patterns section — one snippet per test type that exists in this project:
  - Unit test of a service/use-case (showing mock setup, AAA, async resolution if applicable).
  - Unit test of a controller/handler (showing how the auth token is mocked, static method mocking if used).
  - Integration or listener test (showing embedded broker or Testcontainers usage if applicable).
  - Exception handler test (showing all HTTP status codes are covered).
  Derive every snippet from real test files you read in Step 1. Match the actual assertion
  library, mock style, and naming convention used in the existing tests.
- Rules table — one row per non-obvious testing rule in this codebase.
- End-of-task checklist — how to run tests and verify coverage thresholds.

**`database.md`** (mode: subagent) — include only if the project uses a relational DB with migrations.
- Migration rules — naming convention, version sequencing, index requirements.
- Entity / document patterns — from real entities/documents in the codebase.
- Repository conventions — method naming, query annotation style, transaction rules.

**`devops.md`** (mode: subagent) — include only if the project has CI/CD config or Dockerfiles.
- Docker / compose patterns specific to this project.
- CI pipeline steps and what each does.
- Environment variable inventory and how to add a new one.

**`security.md`** (mode: subagent, edit: deny, bash: deny) — include only if the project handles auth or sensitive data.
- Threat model for this specific project (what data, what attack surfaces).
- OWASP Top-10 checklist adapted to this stack.
- Secret management rules derived from what the project actually uses.

**`api.md`** (mode: subagent) — include only if the project exposes an HTTP API.
- REST conventions: path pattern, HTTP method usage, status code table.
- OpenAPI annotation pattern derived from real API interface files.
- Request/Response record or DTO conventions.

---

### D. Skill files (`.opencode/skills/<name>.md`)

One skill file per common, repeatable task in this project. Derive the skill list from the
project's actual workflow — do not generate generic skills.

**Minimum skills to generate (adapt names and steps to the actual tech stack):**

1. **`implement-feature.md`** — end-to-end guide: how to add a new endpoint and its backing logic,
   including all layers the developer must touch, in order, with the exact file paths and
   naming rules for this project.

2. **`add-<messaging>-consumer.md`** — how to add a new event consumer/listener, from broker
   configuration to the handler class. Include topic registration, error handling pattern,
   and the test pattern for the listener. Skip if the project has no messaging.

3. **`add-<migration-tool>-migration.md`** — how to create a schema migration: naming rules,
   version sequencing, index requirements, and verification steps. Skip if no SQL DB.

4. **`security-audit.md`** — structured audit prompt: what grep commands to run, what patterns
   to look for, what the output report should contain. Derive the grep patterns from the
   actual vulnerabilities relevant to this stack (e.g., for Spring Boot: hardcoded secrets,
   missing `@Valid`, SQL concatenation; for Node.js: `eval`, prototype pollution, missing
   input sanitization).

**Skill file format:**
```markdown
# <Skill Name>

## When to use
<One sentence: the trigger condition.>

## Steps
1. ...
2. ...

## Checklist
- [ ] ...
```

Each skill file should be self-contained: a developer who has never worked on this project
should be able to follow it without reading AGENTS.md first.

---

### E. Hook scripts (`.opencode/hooks/*.sh`)

**`.opencode/hooks/before-edit.sh`**

Receives `$1 = FILE` (the file about to be edited). Emit a `[WARN]` message and exit 0
(never block the edit) when the file matches any of:

- Build output directories (e.g., `target/`, `dist/`, `build/`, `.next/`, `__pycache__/`).
- Binary or generated files (e.g., `*.class`, `*.jar`, `*.pyc`, lock files auto-generated by
  the build tool).
- Infrastructure secrets or keystores detected in this project (e.g., `bootstrap.yml`,
  `application-prod.yml`, `*.jks`, `*.p12`, `*.pem`). Derive the list from what you found
  in Step 1.
- Vendor/dependency directories (`node_modules/`, `.gradle/`, `.mvn/` cache).

**`.opencode/hooks/after-session.sh`**

Print a pre-commit checklist to stdout. The checklist must include:

- The exact build and test commands for this project (from Step 1).
- Static analysis command (from Step 1).
- Coverage verification command (from Step 1).
- A reminder to check for secrets and PII in new files.
- A reminder to update the env-vars documentation if new variables were added.
- A reminder to add a migration if the DB schema was changed.

Both scripts must be executable (`chmod +x`) and use `#!/usr/bin/env sh` as the shebang.

---

### F. Tool wrapper scripts (`.opencode/tools/<name>.sh`)

One wrapper script per database MCP that requires credentials. The wrapper must:

1. Declare all required env-vars with `: "${VAR:?VAR is not set}"` to fail loudly.
2. Construct the connection string/URL from env-vars only — never hardcode host, port, or credentials.
3. `exec` the MCP server command (do not use `npx` without `-y`).
4. Include a comment block listing which env-vars are required and which are optional with defaults.

Make scripts executable.

---

## Quality rules (apply to every artifact)

1. **No invented patterns** — every code snippet, package path, class name, and convention must
   be verified against the actual source files read in Step 1. If you are unsure whether a
   pattern exists, grep for it before including it.

2. **No secrets** — no passwords, API keys, tokens, or credentials anywhere in generated files.
   All sensitive values are env-vars or Vault paths.

3. **No PII in examples** — use `user@example.com`, `+15551234567`, `John Doe` as placeholders.

4. **Language** — write all generated files in English. Comments, descriptions, and prose in
   English. Code identifiers follow the project's existing naming language (do not translate
   variable names).

5. **No filler** — do not repeat content across files. If a rule is in AGENTS.md, reference it
   from the agent file with a one-liner; do not copy it verbatim.

6. **No documentation files unless asked** — do not create README files, changelog entries, or
   wiki pages. Only create the files listed in Step 2.

7. **Executable hooks and tools** — all `.sh` files must have the execute bit set.

8. **Agent frontmatter has exactly five fields** — `description`, `mode`, `model`,
   `temperature`, `permissions`. Do NOT add a `tools:` YAML array — OpenCode rejects it
   with a schema validation error. Document MCP usage in the agent body and in AGENTS.md §10.

9. **Config is valid JSONC** — `config.jsonc` must parse as valid JSON after stripping comments.
   Do not use trailing commas, unquoted keys, or non-standard extensions.

10. **Derived, not assumed** — if the project's tech stack does not include Kafka, do not
    generate a Kafka skill. If the project has no SQL database, do not generate a database
    agent or migration skill. Generate only what the project actually needs.

---

## Output order

Generate files in this order, stating the file path before each one:

1. `.opencode/config.jsonc`          ← §A
2. `.opencode/AGENTS.md`             ← §B
3. `.opencode/agents/developer.md`   ← §C
4. `.opencode/agents/reviewer.md`    ← §C
5. `.opencode/agents/tester.md`      ← §C
6. Additional agent files (database, devops, security, api) — only if applicable. ← §C
7. `.opencode/skills/*.md` (one at a time)          ← §D
8. `.opencode/hooks/before-edit.sh`                 ← §E
9. `.opencode/hooks/after-session.sh`               ← §E
10. `.opencode/tools/*.sh` (one per database MCP)   ← §F
11. Usage reminder (inline, no file written)        ← §G

### G. Usage reminder (print inline, do not write to file)

After writing all files, print the following block verbatim so the developer knows how to
use what was just generated:

```
── How to invoke agents in OpenCode ───────────────────────────────────────────
  @developer  (or just start typing — it is the default agent)
  @reviewer   code review of the current diff
  @tester     write or improve tests
  @database   schema migrations and repository changes
  @devops     Docker, CI/CD, environment variables
  @security   OWASP audit (read-only)
  @api        REST contract design and OpenAPI annotations

Keyboard shortcuts (configured in config.jsonc):
  Ctrl+Shift+D → developer   Ctrl+Shift+R → reviewer
  Ctrl+Shift+T → tester      Ctrl+Shift+B → database
  Ctrl+Shift+K → devops      Ctrl+Shift+S → security
  Ctrl+Shift+A → api

Invoke skills with:  /skill-name  (e.g., /implement-feature)
────────────────────────────────────────────────────────────────────────────────
```

---

After all files are written, print a one-paragraph summary stating:
- How many files were generated.
- Which agents, skills, and MCPs were included.
- Any project-specific patterns that required deviation from the template above.
- Any missing information that the developer must fill in manually (e.g., model IDs,
  env-var names for credentials not found in the source).
