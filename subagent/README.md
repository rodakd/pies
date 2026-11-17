# Pi subagents (vendored)

Vendored from Pi's official example
`examples/extensions/subagent/` @ release 1.5.2. Upstream changes land with
`pi update`: re-diff against the new release's example dir and port changes.

## What this adds

- **`subagent` tool** — the main model can delegate to specialized agents
  running in isolated `pi` subprocesses. Three modes: single (`{ agent, task }`),
  parallel (`{ tasks: [...] }`, max 8 / 4 concurrent), and chain
  (`{ chain: [...] }` with a `{previous}` output placeholder).
- **Agents** (`~/.pi/agent/agents/*.md` → `agents/` here):
  `scout` (read-only recon/triage), `planner` (read-only planning),
  `reviewer` (read-only review), `worker` (general-purpose, all tools).
- **Workflow prompt** (`~/.pi/agent/prompts/*.md` → `prompts/` here):
  a single `/workflow` — plan (scout→planner), **stop for approval**, then
  worker implements; a cheap read-only scout audits task-owned changes
  against the original request and approved plan; the strong reviewer
  inspects those hunks/call sites and broadens if needed; worker fixes
  findings, at most two rounds.

**Local changes vs upstream**

1. Re-pinned the sample agents' `model:` fields (claude-haiku/sonnet →
   our OpenRouter models) by cost and role: `planner` + `reviewer`
   (bounded reasoning) → `openrouter/~openai/gpt-sol-latest:high`;
   `scout` + `worker` (recon/mechanical implementation) →
   `openrouter/~deepseek/deepseek-flash-latest:high`.
   Always pin the **provider-qualified** form (`provider/model-id`): a bare
   id can be ambiguous across authenticated providers and the child then
   exits with a startup error.
2. The tool description now enumerates the discovered agent roster
   (upstream lists only the modes), so the model can delegate on its own
   initiative instead of discovering agents by trial and error.
3. `settings.json` sets `defaultProvider: "openrouter"` and
   `defaultModel: "~openai/gpt-sol-latest"`, with per-model thinking levels
   high for both Sol and DeepSeek Flash. Model defaults apply to new
   sessions; use `/model` to change an existing session.
4. **Recursion guard**: spawned children get `PI_SUBAGENT_DEPTH` in their
   environment, and the extension does not register the `subagent` tool in a
   process that is itself a subagent (`depth >= MAX_SUBAGENT_DEPTH`, default 1).
   Upstream children run plain `pi` with the same agent dir, so without this a
   subagent could spawn grandchildren, and those again — unbounded, each a
   full billed `pi` run (×8 per call in parallel mode). With the guard the
   model in a child session never sees the tool, so nesting is structurally
   impossible; a child's bash also inherits the marker, so `pi -p` from inside
   a child cannot resume the chain. Raise `MAX_SUBAGENT_DEPTH` in
   `pi/subagent/index.ts` to allow deliberate deeper nesting.

## Verified behavior

- Fresh `pi` (depth 0): `subagent` in the tool list; parent → worker dispatch
  works end-to-end.
- Depth-1 child (`PI_SUBAGENT_DEPTH=1`): tool list is `read, bash, edit, write`
  — no `subagent`.
- Parent → worker → “spawn another worker”: child cannot — reports no such
  tool and confirms the env marker; no grandchild process.

Project-local agents (`.pi/agents/*.md` in a repo) are **not** loaded by
default — the tool passes `agentScope: "user"` unless you say otherwise. That
is the safe default: a repo you clone could otherwise ship prompts that run
arbitrary bash through subagents.

## Layout & symlinks

```
~/.pi/agent/extensions/subagent -> ~/repos/pies/subagent
~/.pi/agent/agents/*.md         -> ~/repos/pies/agents/*.md
~/.pi/agent/prompts/*.md       -> ~/repos/pies/prompts/*.md
~/.pi/agent/AGENTS.md          -> ~/repos/pies/AGENTS.md
~/.pi/agent/settings.json      -> ~/repos/pies/settings.json
```

`install.sh` leaves an existing unrelated `~/.pi/agent/AGENTS.md` untouched
and prints a manual merge note instead of overwriting it.

## Cost model

Each subagent is a full `pi` run: its own context window, its own API usage.
Child usage is shown per-result but **not** added to this session's totals.
Routing work to cheaper children can reduce cost when the task matches their
scope, but savings depend on the workload and subprocess overhead; there is
no guaranteed saving.
