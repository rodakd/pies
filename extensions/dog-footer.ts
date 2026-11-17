// Dog footer — paw-print stats replace the built-in token stats line.
//
// Vendored at ~/repos/pies/extensions/dog-footer.ts, symlinked to
// ~/.pi/agent/extensions/dog-footer.ts (auto-discovered, user scope).
// Pattern from the official example examples/extensions/custom-footer.ts
// @ 1.5.2: ctx.ui.setFooter() replaces the built-in footer. After editing,
// run /reload inside Pi to hot-reload the change.
//
// Same data as the built-in (dist/modes/interactive/components/footer.js),
// doggo labels:
//
//   built-in                          → doggo
//   ↑37   (input tokens)              → 👃 sniffed 37         (nose = bright,
//                                                             🐾 was dark brown)
//   ↓49   (output tokens)             → 💬 barked 49
//   R3.2k (cache read)                → 🦴 fetched 3.2k
//   W     (cache write)               → 💾 buried 2.1k        (only if > 0)
//   CH98.9% (cache hit)               → 🎾 caught 98.9%
//   $0.000 (cost)                     → 💰 $0.000 (cost, same format as
//                                        built-in)
//   0.3%/1.0M (auto) (context)        → 🏠 den 3.0k/1.0M (auto)  (tokens used /
//                                        window, whole k — not %; color still
//                                        thresholds at 70%/90% of window)
//
// Layout mirrors the built-in: line 1 = dim cwd (branch) [• session name],
// line 2 = dim stats with the context % colored by threshold (warning > 70%,
// error > 90%) and the model right-aligned, then extension statuses. Run
// /builtin-footer to restore the stock footer.

import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { isAbsolute, relative } from "node:path";

/** Session surface this extension reads (structurally compatible). */
type SessionInfo = {
	getCwd(): string;
	getSessionName(): string | undefined;
	getEntries(): Iterable<{ type: string; message?: unknown }>;
};
/** Assistant message usage (pi-ai MessageUsage subset this extension reads). */
type Usage = {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
	cost: { total: number };
};

function fmtTokens(n: number): string {
	if (n < 1000) return `${n}`;
	if (n < 10000) return `${(n / 1000).toFixed(1)}k`;
	if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
	if (n < 10_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	return `${Math.round(n / 1_000_000)}M`;
}

/** cwd with ~ substitution, like the built-in formatCwdForFooter. */
function fmtCwd(cwd: string): string {
	const home = process.env.HOME ?? "";
	if (home) {
		const rel = relative(home, cwd);
		if (rel === "") return "~";
		if (!rel.startsWith("..") && !isAbsolute(rel)) return `~/${rel}`;
	}
	return cwd;
}

/** Usage totals + latest cache-hit rate, scanned from session entries. */
function collectUsage(session: SessionInfo): {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
	cost: number;
	catchRate: number | undefined;
} {
	let input = 0;
	let output = 0;
	let cacheRead = 0;
	let cacheWrite = 0;
	let cost = 0;
	let catchRate: number | undefined;
	for (const entry of session.getEntries()) {
		if (entry.type !== "message") continue;
		const message = entry.message as { role?: string; usage?: Usage } | undefined;
		if (message?.role !== "assistant" || !message.usage) continue;
		const u = message.usage;
		input += u.input;
		output += u.output;
		cacheRead += u.cacheRead;
		cacheWrite += u.cacheWrite;
		cost += u.cost?.total ?? 0;
		const prompt = u.input + u.cacheRead + u.cacheWrite;
		if (prompt > 0) catchRate = (u.cacheRead / prompt) * 100;
	}
	return { input, output, cacheRead, cacheWrite, cost, catchRate };
}

/** The 🏠 den part: context tokens used (whole k) / window, dim like the
 * other stats, colored past thresholds (warning > 70%, error > 90% of the
 * window — same thresholds the built-in applies to its context %).
 * Emoji takes no color — dim wraps only the text (dim ANSI over emoji
 * renders dark). tokens=null (right after compaction) shows "?". */
function denPart(
	theme: Theme,
	tokens: number | null,
	contextWindow: number,
	autoCompact: boolean,
): string {
	const pct = tokens !== null && contextWindow > 0 ? (tokens / contextWindow) * 100 : null;
	const usedStr = tokens !== null ? fmtTokens(tokens) : "?";
	const suffix = autoCompact ? " (auto)" : "";
	const emoji = "🏠";
	const text = `den ${usedStr}/${fmtTokens(contextWindow)}${suffix}`;
	if (pct !== null && pct > 90) return `${emoji} ${theme.fg("error", text)}`;
	if (pct !== null && pct > 70) return `${emoji} ${theme.fg("warning", text)}`;
	return `${emoji} ${theme.fg("dim", text)}`;
}

export default function dogFooter(pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		if (!ctx.hasUI) return; // print/JSON modes keep the default
		const session = ctx.sessionManager as SessionInfo;

		ctx.ui.setFooter((tui, theme, footerData) => {
			// Git branch changes (checkout etc.) should re-render the footer.
			const unsubscribe = footerData.onBranchChange(() => tui.requestRender());

			return {
				dispose: unsubscribe,
				invalidate() {},
				render(width: number): string[] {
					// Line 1: dim cwd (branch) • session name — as the built-in shows.
					let pwd = fmtCwd(session.getCwd());
					const branch = footerData.getGitBranch();
					if (branch) pwd = `${pwd} (${branch})`;
					const sessionName = session.getSessionName();
					if (sessionName) pwd = `${pwd} • ${sessionName}`;
					const pwdLine = truncateToWidth(theme.fg("dim", pwd), width, theme.fg("dim", "..."));

					// Line 2: doggo stats left, model right-aligned.
					// Emoji take no color codes: dim wraps only the text (dim ANSI
					// over emoji renders them dark in most terminals).
					const u = collectUsage(session);
					const parts: string[] = [];
					parts.push(`👃 ${theme.fg("dim", `sniffed ${fmtTokens(u.input)}`)}`);
					parts.push(`💬 ${theme.fg("dim", `barked ${fmtTokens(u.output)}`)}`);
					if (u.cacheRead) parts.push(`🦴 ${theme.fg("dim", `fetched ${fmtTokens(u.cacheRead)}`)}`);
					if (u.cacheWrite) parts.push(`💾 ${theme.fg("dim", `buried ${fmtTokens(u.cacheWrite)}`)}`);
					if (u.catchRate !== undefined && (u.cacheRead > 0 || u.cacheWrite > 0)) {
						parts.push(`🎾 ${theme.fg("dim", `caught ${u.catchRate.toFixed(1)}%`)}`);
					}
					if (u.cost > 0) parts.push(`💰 ${theme.fg("dim", `$${u.cost.toFixed(3)}`)}`);

					const contextUsage = ctx.getContextUsage();
					const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
					// The den part may carry its own color (error/warning) + reset,
					// which would clear an outer dim — so it styles its own text.
					// Parts already carry their own dim styling (text only, emoji bright).
					const statsLeft = `${parts.join(" ")} ${denPart(theme, contextUsage?.tokens ?? null, contextWindow, true)}`;

					const modelName = ctx.model?.id ?? "no-model";
					const thinking = ctx.thinkingLevel && ctx.thinkingLevel !== "off" ? ` • ${ctx.thinkingLevel}` : "";
					const rightSide = theme.fg("dim", `${modelName}${thinking}`);

					let statsLeftWidth = visibleWidth(statsLeft);
					const minPadding = 2;
					let statsLine: string;
					if (statsLeftWidth > width) {
						statsLine = truncateToWidth(statsLeft, width, "...");
					} else if (statsLeftWidth + minPadding + visibleWidth(rightSide) <= width) {
						const padding = " ".repeat(width - statsLeftWidth - visibleWidth(rightSide));
						statsLine = statsLeft + padding + rightSide;
					} else {
						const available = width - statsLeftWidth - minPadding;
						const truncated = available > 0 ? truncateToWidth(rightSide, available, "") : "";
						statsLine = statsLeft + " ".repeat(Math.max(0, width - statsLeftWidth - visibleWidth(truncated))) + truncated;
					}

					const lines = [pwdLine, statsLine];

					// Extension statuses (ctx.ui.setStatus slots), one dim line.
					const statuses = Array.from(footerData.getExtensionStatuses().values());
					if (statuses.length > 0) {
						lines.push(truncateToWidth(statuses.join(" "), width, theme.fg("dim", "...")));
					}
					return lines;
				},
			};
		});
	});

	// Restore the stock footer on demand.
	pi.registerCommand("builtin-footer", {
		description: "Restore built-in pi footer",
		handler: async (_args, ctx) => {
			ctx.ui.setFooter(undefined);
			ctx.ui.notify("Built-in footer restored", "info");
		},
	});
}