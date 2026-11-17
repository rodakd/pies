# pies 🐶

A dog-themed [pi](https://pi.dev) coding agent setup. pi, but it's a dog.

Everything lives in this repo and is symlinked into pi's config dir
(`~/.pi/agent`) by `install.sh` — nothing is copied, so `git pull` +
re-run `install.sh` (usually not even needed) is the whole update story.

## What you get

**Extensions** (`extensions/`, auto-discovered):

| File | What it does |
|---|---|
| `pies.ts` | Customization entry (the "init.lua" equivalent). Hides the "Thinking..." label (empty label = hidden runs render nothing). |
| `dog-header.ts` | Startup header: multi-line pixel-art shiba (22×14 half-block render) replaces the pi logo, subtitle `🐶 woof! · pies v… 🐶`. `/builtin-header` restores stock. |
| `dog-footer.ts` | Footer stats, doggo edition: `👃 sniffed <in> 💬 barked <out> 🦴 fetched <cache R> 💾 buried <cache W> 🎾 caught <hit%> 🏠 den <tokens>/<window>`. `/builtin-footer` restores stock. |
| `dog-editor.ts` | `🐶` prefix in the prompt input (click mapping + wrapping compensated). |
| `working-words.ts` | The "Working" loader above the prompt rotates Claude-Code-style gerunds: `⠙ Bamboozling…`, `⠙ Hornswoggling…`, … |
| `subagent/` | Vendored subagent tool (delegation to `scout`/`worker`/`planner`/`reviewer`/`fixer`) from pi's official example — see `subagent/README.md` for local changes. |

**Theme** (`themes/nord.json`): Nord palette matching the terminal
(Alacritty `nord.toml`), blue prompt border ladder by thinking level,
blue tool-call backgrounds.

**Agents & prompts**: `agents/` — `scout` + `worker` on
`openrouter/~deepseek/deepseek-flash-latest:high` (recon and mechanical work),
`planner` + `reviewer` + `fixer` on `openrouter/~openai/gpt-sol-latest:high` as
opt-in: they run only when you explicitly request them or approve a proposed
dispatch naming them and its scope. `fixer` is the escalation path — a Sol
worker with full tools for work a cheap `worker` could not complete. Global
instructions in `AGENTS.md` make the main model the
coordinator that plans and reviews in its own context by default, routing
broad recon to scout and mechanical work to worker. `prompts/` — one
`/workflow`: scout recon, **stop for approval**, worker implements, a cheap
read-only scout triages only task-owned changes, the main model reviews those
hunks/call sites against the original request and plan, and the worker fixes
findings (at most two fix/review rounds). Escalation to `fixer` is proposed,
never automatic. No step adds a paid planner, reviewer, or fixer run on its own.

**Models & cost**: `settings.json` starts new sessions on OpenRouter DeepSeek
Flash at high thinking; the enabled model scope cycles Flash and Sol.
Existing sessions keep their selection — use `/model` (and `/thinking`).
Scout and worker children are Flash; planner, reviewer, and fixer are Sol and
cost more, so they stay opt-in. Child runs are separate `pi` processes with their
own usage, not added to the parent's totals.

**CLI**: `bin/pies` — runs `pi` under its proper name.

## Install

Requires [pi](https://pi.dev) (`~/.pi/agent/bin/pi`) and `~/bin` on PATH.

```sh
git clone git@github.com:rodakd/pies.git ~/repos/pies
~/repos/pies/install.sh
pi login          # or: pies login — provider auth stays local
```

`install.sh` also links a global `AGENTS.md`. If `~/.pi/agent/AGENTS.md`
already exists and is not a link to this repo's file, it is left untouched
with a manual merge note.

Then run `pies`. After editing anything here, `/reload` inside pi refreshes
extensions, themes, prompts, and instructions. Model defaults in
`settings.json` apply to new sessions; use `/model` (and `/thinking`) to
change the current session.

## Layout

```
pies/
├── install.sh          # symlink installer (idempotent)
├── AGENTS.md           # global coordinator/routing instructions
├── settings.json       # theme + model routing prefs (symlinked to ~/.pi/agent)
├── pies.ts             # customization entry
├── bin/pies            # CLI wrapper
├── extensions/         # dog-editor, dog-footer, dog-header, working-words
├── subagent/           # vendored subagent tool
├── themes/nord.json    # Nord theme
├── agents/             # scout, worker, planner, reviewer, fixer
└── prompts/            # /workflow prompt
```

Not in the repo (local only): `~/.pi/agent/auth.json` (credentials),
`models-store.json`, `sessions/`.
