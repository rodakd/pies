#!/bin/sh
# pies — install the dog-themed pi coding agent setup.
#
# Symlinks everything from this repo into ~/.pi/agent (pi's user config dir)
# and ~/bin. Idempotent: safe to re-run after pulling changes.
#
# What is NOT managed here (stays local, never committed):
#   ~/.pi/agent/auth.json        — provider credentials
#   ~/.pi/agent/models-store.json — cached model catalog
#   ~/.pi/agent/sessions/        — chat history

set -eu
REPO="$(cd "$(dirname "$0")" && pwd)"
AGENT="$HOME/.pi/agent"

mkdir -p "$AGENT/extensions" "$AGENT/themes" "$AGENT/agents" "$AGENT/prompts" "$HOME/bin"

link() { # link <target> <linkname>
	mkdir -p "$(dirname "$2")"
	ln -sfn "$1" "$2"
}

# Customization entry ("init.lua" equivalent)
link "$REPO/pies.ts" "$AGENT/extensions/pies.ts"

# Extensions (auto-discovered)
for f in "$REPO"/extensions/*.ts; do
	link "$f" "$AGENT/extensions/$(basename "$f")"
done
link "$REPO/subagent" "$AGENT/extensions/subagent"

# Theme
link "$REPO/themes/nord.json" "$AGENT/themes/nord.json"

# Subagents + workflow prompts
for f in "$REPO"/agents/*.md; do
	link "$f" "$AGENT/agents/$(basename "$f")"
done
for f in "$REPO"/prompts/*.md; do
	link "$f" "$AGENT/prompts/$(basename "$f")"
done

# Settings (theme + model prefs). Note: pi rewrites lastChangelogVersion
# in this file at runtime — commit those bumps (or ignore the churn).
link "$REPO/settings.json" "$AGENT/settings.json"

# CLI wrapper
link "$REPO/bin/pies" "$HOME/bin/pies"

echo "✓ pies installed. Run: pies"