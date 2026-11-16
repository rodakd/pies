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
| `subagent/` | Vendored subagent tool (delegation to `scout`/`planner`/`reviewer`/`worker`) from pi's official example — see `subagent/README.md` for local changes. |

**Theme** (`themes/nord.json`): Nord palette matching the terminal
(Alacritty `nord.toml`), blue prompt border ladder by thinking level,
blue tool-call backgrounds.

**Agents & prompts**: `agents/` (scout, planner, reviewer, worker) and
`prompts/` — a single `/workflow` command: plan (scout → planner),
**stop for approval**, implement (worker), review against the original
request (reviewer), fix (worker).

**CLI**: `bin/pies` — runs `pi` under its proper name.

## Install

Requires [pi](https://pi.dev) (`~/.pi/agent/bin/pi`) and `~/bin` on PATH.

```sh
git clone git@github.com:rodakd/pies.git ~/repos/pies
~/repos/pies/install.sh
pi login          # or: pies login — provider auth stays local
```

Then run `pies`. After editing anything here, `/reload` inside pi
hot-reloads extensions and the theme.

## Layout

```
pies/
├── install.sh          # symlink installer (idempotent)
├── settings.json       # theme + model prefs (symlinked to ~/.pi/agent)
├── pies.ts             # customization entry
├── bin/pies            # CLI wrapper
├── extensions/         # dog-editor, dog-footer, dog-header, working-words
├── subagent/           # vendored subagent tool
├── themes/nord.json    # Nord theme
├── agents/             # scout, planner, reviewer, worker
└── prompts/            # workflow prompts
```

Not in the repo (local only): `~/.pi/agent/auth.json` (credentials),
`models-store.json`, `sessions/`.
