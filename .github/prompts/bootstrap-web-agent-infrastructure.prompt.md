---
name: Bootstrap Web Agent Infrastructure
description: >
  Analyze any web project and generate a complete, project-adapted agent infrastructure:
  agents, skills, tools, prompts, and hooks. Covers any web framework (Angular, React,
  Vue, Next.js, Nuxt, SvelteKit, Remix, Astro) with optional BFF layer.
  Produces a final structured summary.
mode: agent
agent: orchestrator
tools: [run_in_terminal, read_file, grep_search, file_search, create_file, insert_edit_into_file, replace_string_in_file]
---

You are the **Web Agent Infrastructure Bootstrap** assistant.

Your mission: analyze the target web project from scratch, then generate a complete,
project-adapted agent infrastructure under `.github/` — including agents, skills,
tools, prompts, and hooks. Every artifact must reflect the real conventions,
tech stack, and workflows of THIS project, not a generic web template.

---

## PHASE 0 — Project Reconnaissance

Before creating anything, deeply analyze the repository. Collect every answer below.
Do not proceed to Phase 1 until all fields are recorded.

### 0.1 — Package Manager and Runtime

```bash
ls package.json package-lock.json yarn.lock pnpm-lock.yaml bun.lockb 2>/dev/null
node --version 2>/dev/null
cat package.json | python3 -c "import sys,json; d=json.load(sys.stdin); print('name:', d.get('name')); print('scripts:', list(d.get('scripts',{}).keys()))"
```

### 0.2 — Framework and Version

```bash
# Detect framework from dependencies
cat package.json | python3 -c "
import sys, json
d = json.load(sys.stdin)
deps = {**d.get('dependencies',{}), **d.get('devDependencies',{})}
frameworks = ['@angular/core','react','vue','next','nuxt','@sveltejs/kit','remix','astro','solid-js','qwik']
for f in frameworks:
    if f in deps:
        print(f, deps[f])
"

# SSR / build adapter
ls next.config.* nuxt.config.* svelte.config.* astro.config.* vite.config.* angular.json 2>/dev/null
```

### 0.3 — BFF / Server Layer

```bash
# Express, Fastify, Hono, tRPC
cat package.json | python3 -c "
import sys, json
d = json.load(sys.stdin)
deps = {**d.get('dependencies',{}), **d.get('devDependencies',{})}
servers = ['express','fastify','hono','koa','@trpc/server','h3']
for s in servers:
    if s in deps:
        print(s, deps[s])
"

# Server entry points
ls server.js server.ts app.js src/server* 2>/dev/null
find . -name "*.routes.*" -not -path "*/node_modules/*" 2>/dev/null | head -10
```

### 0.4 — State Management

```bash
cat package.json | python3 -c "
import sys, json
d = json.load(sys.stdin)
deps = {**d.get('dependencies',{}), **d.get('devDependencies',{})}
state = ['@ngrx/store','@reduxjs/toolkit','redux','zustand','pinia','jotai','recoil','mobx','valtio','nanostores']
for s in state:
    if s in deps:
        print(s, deps[s])
"
```

### 0.5 — Styling

```bash
cat package.json | python3 -c "
import sys, json
d = json.load(sys.stdin)
deps = {**d.get('dependencies',{}), **d.get('devDependencies',{})}
css = ['tailwindcss','@tailwindcss/postcss','bootstrap','@mui/material','@chakra-ui/react','styled-components','@emotion/react','sass','less']
for c in css:
    if c in deps:
        print(c, deps[c])
"
ls tailwind.config.* postcss.config.* 2>/dev/null
```

### 0.6 — Auth and Session

```bash
cat package.json | python3 -c "
import sys, json
d = json.load(sys.stdin)
deps = {**d.get('dependencies',{}), **d.get('devDependencies',{})}
auth = ['next-auth','@auth/core','jsonwebtoken','passport','cookie-session','express-session','@supabase/supabase-js','firebase']
for a in auth:
    if a in deps:
        print(a, deps[a])
"
grep -rn "session-token\|Authorization\|Bearer\|jwt\|JWT" src/ server/ --include="*.ts" --include="*.js" -l 2>/dev/null | head -10
```

### 0.7 — Routing Structure

```bash
# File-based routing (Next.js, Nuxt, SvelteKit) vs config-based (Angular, React Router)
find src app pages -type f -name "*.routes.*" -o -name "routes.ts" -o -name "router.ts" 2>/dev/null | grep -v node_modules | head -10
ls src/app/app.routes.ts src/router/ pages/ app/ 2>/dev/null
```

### 0.8 — i18n

```bash
cat package.json | python3 -c "
import sys, json
d = json.load(sys.stdin)
deps = {**d.get('dependencies',{}), **d.get('devDependencies',{})}
i18n = ['@ngx-translate/core','i18next','react-i18next','vue-i18n','next-intl','@nuxtjs/i18n']
for i in i18n:
    if i in deps:
        print(i, deps[i])
"
```

### 0.9 — Test Framework

```bash
cat package.json | python3 -c "
import sys, json
d = json.load(sys.stdin)
deps = {**d.get('dependencies',{}), **d.get('devDependencies',{})}
test = ['jasmine-core','karma','jest','vitest','@testing-library/angular','@testing-library/react','@testing-library/vue','playwright','cypress','@playwright/test']
for t in test:
    if t in deps:
        print(t, deps[t])
"
grep -E '"test":|"test:headless":' package.json 2>/dev/null
```

### 0.10 — Static Analysis

```bash
cat package.json | python3 -c "
import sys, json
d = json.load(sys.stdin)
deps = {**d.get('dependencies',{}), **d.get('devDependencies',{})}
lint = ['eslint','@eslint/js','typescript-eslint','biome','prettier','@biomejs/biome']
for l in lint:
    if l in deps:
        print(l, deps[l])
"
ls .eslintrc* eslint.config.* biome.json .prettierrc* 2>/dev/null
grep -E '"lint":|"format":' package.json 2>/dev/null
```

### 0.11 — Source Structure

```bash
find src -type d 2>/dev/null | grep -v node_modules | sort | head -40
find app -type d 2>/dev/null | grep -v node_modules | sort | head -20
```

### 0.12 — CI/CD and Docker

```bash
find .github/workflows -name "*.yml" 2>/dev/null | head -10
ls Dockerfile docker-compose.yml docker-compose.yaml 2>/dev/null
```

### 0.13 — Existing .github/ Structure

```bash
find .github -type f 2>/dev/null | sort
```

Record the full snapshot before proceeding:

```
WEB PROJECT SNAPSHOT
  Framework:          <e.g., Angular 20 / React 18 / Next.js 14 / Vue 3>
  Language:           <TypeScript x.x strict / JavaScript ESM>
  Package manager:    <npm / pnpm / yarn / bun>
  BFF layer:          <Express 5 / Fastify / none — file-based API routes>
  State management:   <NgRx 20 / Redux Toolkit / Zustand / Signals / none>
  Styling:            <Tailwind v4 / CSS Modules / styled-components / Bootstrap>
  Auth strategy:      <session-token header / JWT Bearer / NextAuth / session cookie>
  Routing:            <config-based (Angular/React Router) / file-based (Next/Nuxt/SvelteKit)>
  i18n:               <@ngx-translate / i18next / vue-i18n / none>
  Test framework:     <Jasmine+Karma / Vitest / Jest / Playwright>
  Lint/format:        <ESLint / Biome / Prettier / TypeScript strict only>
  SSR:                <@angular/ssr / Next.js / Nuxt / SvelteKit / none>
  CI/CD:              <GitHub Actions / none>
  Docker:             <yes / no>
  Existing .github:   <list or "none">
```

---

## PHASE 1 — Define Agent Roster

Based on the snapshot, select agents. Every web project gets the mandatory set.
Add conditional agents only when the condition is confirmed in Phase 0.

### Mandatory Agents (every web project)

| Agent | Role | Invocable |
|-------|------|-----------|
| `orchestrator` | Decomposes multi-step requests, delegates to subagents, consolidates reports | User-facing |
| `developer` | Implements components, services, routes, and BFF handlers per project conventions | User-facing |
| `test-writer` | Writes unit and integration tests in the project's test framework | User-facing |
| `code-reviewer` | Diff review: conventions, TypeScript errors, bundle-impact, accessibility basics | Subagent only |
| `security-reviewer` | OWASP Top-10, auth flow, session token handling, secrets audit | Subagent only |

### Conditional Agents

| Condition confirmed in Phase 0 | Add Agent |
|-------------------------------|-----------|
| Project exposes REST or tRPC API (BFF or file-based routes) | `api-designer` |
| Project uses a relational or document database | `database-architect` |
| Project has CI/CD workflows or Dockerfile | `devops-engineer` |
| Codebase is unfamiliar or undocumented | `repo-analyst` |
| Project has product stories or roadmap | `product-owner` |

For each agent, create `.github/agents/<agent-name>.agent.md`:

```markdown
---
name: <Agent Name>
description: <Role in this specific project>
user-invocable: true/false
subagent-only: true/false
tools:
  - run_in_terminal
  - read_file
  - grep_search
  - file_search
  - insert_edit_into_file
  - replace_string_in_file
  - create_file
  - get_errors
  - run_subagent           # orchestrator only
  - validate_cves          # security-reviewer only
tool-docs:
  - '.github/tools/<relevant-tool>.tool.md'
skill-definition: '.github/skills/<agent-name>/SKILL.md'
---

# <Agent Name>

## Purpose
<What this agent does in the context of THIS project — one paragraph>

## Tech Stack Expertise
<List the exact framework, state library, styling approach, and test runner from the snapshot>

## Conventions to Follow
<Project-specific patterns discovered in Phase 0 — naming, injection style, file structure>

## Output Format
<What the agent produces — files modified, commands run, reports generated>
```

---

## PHASE 2 — Define Skills

### 2.1 — Agent-Specific Skills

For each agent, create `.github/skills/<agent-name>/SKILL.md`:

```markdown
---
name: <Agent> Skills
description: Consolidated skill set for <tech stack + role>
applies-to: [<Agent Name>]
---

# <Agent Name> — Skill Definition

## 1. Component / Module Patterns
<Real code patterns from the project — component structure, injection style, template syntax>

## 2. Naming Conventions
<File names, class names, selector names, CSS class names — real examples from Phase 0>

## 3. State Management Pattern
<How state is read and written — NgRx dispatch/select, useState, Zustand store, signals>

## 4. Routing Pattern
<How routes are declared, guarded, and lazy-loaded in this project>

## 5. Error Handling
<HTTP error flow — interceptors, error boundaries, toast notifications, redirect behavior>

## 6. Key File Paths
<Actual paths found in Phase 0 relevant to this agent's role>

## 7. Constraints
<What this agent must never do — hardcode URLs, use deprecated APIs, bypass auth guard, etc.>

## 8. Quality Checklist
<Agent-specific gates in checkbox format — build command, test command, type-check command>
```

### 2.2 — Shared Skills

Create shared skills when 2+ agents need the same knowledge. File:
`.github/skills/<skill-name>.skill.md`

```markdown
---
name: <Skill Name>
description: Shared — <topic> (<Agent1>, <Agent2>)
applies-to: [<Agent1>, <Agent2>]
---
```

**Web project candidates for shared skills:**

| Skill | Agents |
|-------|--------|
| API contract (path constants, request/response types) | developer + api-designer |
| Auth flow (token storage, guard, interceptor) | developer + security-reviewer |
| Component patterns (structure, template, signals) | developer + code-reviewer + test-writer |
| State management (dispatch, select, signal) | developer + code-reviewer |
| BFF proxy conventions | developer + api-designer |

Only create a shared skill if both agents are in the selected roster.

---

## PHASE 3 — Define Tools

For each npm script, build command, and toolchain element found in Phase 0,
create `.github/tools/<tool-name>.tool.md`.

```markdown
---
name: <Tool Name>
description: Tool for <purpose> in <project name>
type: terminal
command-prefix: <main command, e.g., npm run / npx / ng>
used-by: [<Agent1>, <Agent2>]
---

# <Tool Name>

## Purpose
<What problem this tool solves in THIS project>

## Available Commands

### <Category>
\`\`\`bash
# <what this does>
<exact command from package.json scripts or CLI>
\`\`\`

## Output Locations
<dist/, coverage/, .next/, build/ — actual paths from this project>

## Notes
<Required env-vars, prerequisite steps, known gotchas specific to this project>
```

**Identify tools from Phase 0 output. Standard set for web projects:**

| Tool file | Create when |
|-----------|------------|
| `npm.tool.md` (or `pnpm.tool.md`) | Always — use the detected package manager |
| `typescript.tool.md` | TypeScript project — `tsc --noEmit` for type checking |
| `test-runner.tool.md` | Always — Karma, Vitest, Jest, or Playwright |
| `lint.tool.md` | ESLint or Biome present |
| `git.tool.md` | Always |
| `build.tool.md` | Distinct build command exists (`ng build`, `next build`, `vite build`) |
| `docker-build.tool.md` | Dockerfile present |
| `bundle-analyzer.tool.md` | `@angular/build` budget, webpack-bundle-analyzer, or `next build` output |
| `npm-audit.tool.md` | Always — `npm audit --audit-level=high` |

**Rule**: One canonical file per tool. Remove any file that duplicates another's commands.

---

## PHASE 4 — Create Prompts

For each repetitive task in this web project, create `.github/prompts/<task>.prompt.md`.

### Frontmatter format

```markdown
---
name: <Human-readable task name>
description: <What this prompt accomplishes in this project>
mode: agent
agent: <agent-name>
tools: [run_in_terminal, read_file, grep_search, file_search, insert_edit_into_file, replace_string_in_file, create_file]
---
```

### Standard Web Prompts

| Prompt file | Agent | Trigger |
|-------------|-------|---------|
| `implement-feature.prompt.md` | developer | New feature story or ticket |
| `implement-component.prompt.md` | developer | New UI component needed |
| `add-route.prompt.md` | developer | New page or nested route |
| `add-api-endpoint.prompt.md` | api-designer | New BFF route or file-based API handler |
| `fix-bug.prompt.md` | developer | Bug report |
| `fix-typescript-errors.prompt.md` | developer | Type errors blocking build |
| `write-unit-tests.prompt.md` | test-writer | New code or missing test coverage |
| `review-code.prompt.md` | code-reviewer | PR or push to feature branch |
| `security-audit.prompt.md` | security-reviewer | Pre-release, auth change, dependency update |
| `full-feature-delivery.prompt.md` | orchestrator | Complex multi-layer feature |

**Add conditionally:**

| Prompt file | Agent | Add when |
|-------------|-------|----------|
| `add-database-migration.prompt.md` | database-architect | SQL database in project |
| `review-api-contract.prompt.md` | api-designer | OpenAPI spec or tRPC router present |
| `improve-a11y.prompt.md` | code-reviewer | Accessibility is a stated requirement |
| `prepare-release.prompt.md` | devops-engineer | CI/CD or Docker present |
| `define-story.prompt.md` | product-owner | Product backlog managed in repo |

### Each prompt must contain

1. **Input variables** — `${variableName}` for all required inputs (e.g., `${featureName}`, `${componentSelector}`)
2. **Phase-by-phase instructions** — specific to this project's layer boundaries and file paths
3. **Project constraints** — derived from Phase 0 conventions (not generic web advice)
4. **End-of-task checklist** — the exact build, test, and lint commands for this project
5. **Output format** — structured diff or file list with status (created / modified / deleted)

---

## PHASE 5 — Create Hooks

For each development lifecycle event, create `.github/hooks/<event>.hook.md`.

```markdown
---
name: <Hook Name>
description: <When and why it fires>
trigger: <event-name>
agents: [<agent-name>, ...]
auto-block: true/false
---

# <Hook Name>

## Trigger Conditions
- Event: <pull_request opened / push / merge / release tag>
- Condition: <file filter — e.g., only when src/ changes>

## Steps
<Ordered steps, each referencing a prompt file path>

## Fail Behavior
<block merge / post warning comment / open issue>

## Output
<Structure of the comment or report posted to the PR or commit>
```

### Standard web hooks

| Hook file | Trigger | Blocking | When to create |
|-----------|---------|---------|---------------|
| `pre-pull-request.hook.md` | PR opened to main/develop | Yes | Always |
| `post-push-review.hook.md` | Push to feature branch | No | Always |
| `post-merge-security.hook.md` | Merge when `package.json` changed | No | Always |
| `pre-release-gate.hook.md` | Release tag created | Yes | CI/CD present |

**`pre-pull-request.hook.md` must include (in order):**
1. TypeScript type-check (`tsc --noEmit` or equivalent)
2. Lint/format check (if lint tool present)
3. Unit test run (headless/CI mode)
4. Code review subagent (`review-code.prompt.md`)
5. Security subagent if `package.json` or auth files changed (`security-audit.prompt.md`)

---

## PHASE 6 — Create Index Files

Create catalog files so any agent can discover the full infrastructure:

```
.github/agents/agents.md       — table: agent | invocable | subagent-only | purpose
.github/skills/skills.md       — table: file | type (agent/shared) | applies-to
.github/tools/tools.md         — table: file | command-prefix | used-by | key commands
.github/prompts/prompts.md     — table: file | agent | mode | trigger condition
.github/hooks/hooks.md         — table: file | trigger | blocking | lifecycle position
.github/copilot-agents.md      — master index linking all of the above + quick-start guide
```

**`copilot-agents.md` must include:**
- The project snapshot from Phase 0
- Layer diagram (how a request flows from browser to data source)
- Quick-start invocation examples for the 3 most common tasks
- Links to every index file above

---

## PHASE 7 — Validation

After generating all artifacts, run these checks. Fix all failures before producing the summary.

```bash
# 1. Every agent file has skill-definition
grep -rL "skill-definition:" .github/agents/*.agent.md 2>/dev/null

# 2. Every skill-definition path resolves
for f in .github/agents/*.agent.md; do
  path=$(grep "skill-definition:" "$f" | sed "s/.*: '//;s/'//")
  [ -f "$path" ] || echo "MISSING SKILL: $path  (referenced in $f)"
done

# 3. Every tool-docs path resolves
for f in .github/agents/*.agent.md; do
  grep "\.github/tools/" "$f" | sed "s/.*'\(.*\)'/\1/" | while read p; do
    [ -f "$p" ] || echo "MISSING TOOL: $p  (referenced in $f)"
  done
done

# 4. Every prompt references a valid agent name
grep -h "^agent:" .github/prompts/*.prompt.md | sort | uniq

# 5. Every hook references an existing prompt file
grep -h "prompt\.md" .github/hooks/*.hook.md | sort | uniq | while read line; do
  path=$(echo "$line" | grep -oE "\.github/prompts/[^ '\"]*")
  [ -f "$path" ] || echo "MISSING PROMPT in hook: $path"
done

# 6. TypeScript config is referenced correctly in tool files (if applicable)
grep -rh "tsconfig" .github/tools/*.tool.md 2>/dev/null | head -5
```

---

## FINAL SUMMARY

After completing all phases, produce this structured report:

```markdown
## Web Agent Infrastructure Bootstrap — Summary

### Project Snapshot
| Field | Value |
|-------|-------|
| Name | <project name> |
| Framework | <framework + version> |
| Language | <TypeScript x.x strict / JavaScript> |
| Package manager | <npm / pnpm / yarn> |
| BFF | <Express / Fastify / file-based routes / none> |
| State management | <NgRx / Zustand / Signals / none> |
| Styling | <Tailwind / CSS Modules / etc.> |
| Auth | <strategy from Phase 0.6> |
| Test framework | <Jasmine+Karma / Vitest / Jest / Playwright> |
| Static analysis | <ESLint / Biome / TypeScript strict only> |
| SSR | <@angular/ssr / Next.js / Nuxt / none> |

---

### Phase 1 — Agents Created
| File | Agent | Invocable | Purpose |
|------|-------|-----------|---------|

### Phase 2 — Skills Created
| File | Type | Applies To |
|------|------|------------|
| `.github/skills/<agent>/SKILL.md` | agent-specific | <agent> |
| `.github/skills/<name>.skill.md` | shared | <agent1>, <agent2> |

### Phase 3 — Tools Created / Kept / Removed
| Action | File | Reason |
|--------|------|--------|
| CREATED | ... | ... |
| KEPT | ... | Valid, required |
| REMOVED | ... | Duplicate / incorrect |

### Phase 4 — Prompts Created
| File | Agent | Mode | Trigger |
|------|-------|------|---------|

### Phase 5 — Hooks Created
| File | Trigger | Blocking | Agents |
|------|---------|---------|--------|

### Phase 6 — Index Files
| File | Purpose |
|------|---------|

### Validation Results
| Check | Status | Issues |
|-------|--------|--------|
| Skill paths resolve | PASS/FAIL | <list or "none"> |
| Tool paths resolve | PASS/FAIL | <list or "none"> |
| Prompt agents valid | PASS/FAIL | <list or "none"> |
| Hook prompt refs valid | PASS/FAIL | <list or "none"> |

---

### Quick Start

\`\`\`bash
# Implement a full feature end-to-end
# → orchestrator + full-feature-delivery.prompt.md

# Add a single UI component
# → developer + implement-component.prompt.md  componentName=X selector=app-x

# Run the pre-PR gate manually
<exact build + test + lint commands from this project>
\`\`\`

### Files Created: N total
- N agents   (.github/agents/)
- N skills   (.github/skills/)
- N tools    (.github/tools/)
- N prompts  (.github/prompts/)
- N hooks    (.github/hooks/)
- N indexes  (.github/)
```

---

## Execution Rules

1. **Never invent** — every pattern, path, and command must be confirmed in Phase 0.
2. **No framework assumptions** — detect Angular vs React vs Next.js before writing any agent body. Different frameworks have fundamentally different component models and routing patterns.
3. **BFF is optional** — generate `api-designer` and BFF-related skills/tools only if a server layer is confirmed in Phase 0.3.
4. **File-based routing vs config routing** — detect which model the project uses and reflect it in `add-route.prompt.md` and the `developer` skill.
5. **Shared skills only when earned** — create a shared skill only when 2+ selected agents genuinely need identical knowledge.
6. **One canonical tool file per tool** — no duplicate commands across files.
7. **Prompts must be executable** — after variable substitution, every prompt must produce correct output for this specific project.
8. **Hooks must reference real prompt files** — all cross-references must resolve (validated in Phase 7).
9. **Summary is mandatory** — always end with the structured report above.
10. **TypeScript strict mode is the default** — if the project uses TypeScript, reference `tsconfig.json` in the typescript tool and mention strict-mode implications in the developer skill.
