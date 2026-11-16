// Dog header — multi-line pixel-art 🐶 replaces the pi logo at startup.
//
// Vendored at ~/repos/pies/extensions/dog-header.ts, symlinked to
// ~/.pi/agent/extensions/dog-header.ts (auto-discovered, user scope).
// Pattern from the official example examples/extensions/custom-header.ts
// @ 1.5.2: ctx.ui.setHeader() replaces the built-in startup header
// (pi logo + keybinding hints). After editing, run /reload inside Pi.
//
// The dog is a 22×14 pixel grid (7 terminal lines) rendered with the same
// half-block technique as pi's own logo: each terminal cell encodes two
// stacked pixels — fg colors the ▀ top half, bg the bottom half (▄ when
// only the lower pixel is set). Art and subtitle are left-aligned at a
// fixed 2-space indent. Palette: orange fur, dark floppy ears/eyes/nose,
// cream muzzle, pink tongue:
//
//   F = fur   C = cream   D = dark   P = pink   . = transparent
//
//   ......FFFFFFFFFF......      crown dome
//   ....FFFFFFFFFFFFFF....      (rounded top)
//   .DDFFFFFFFFFFFFFFFFDD.      ear tops (tapered)
//   DDDDFFFFFFFFFFFFFFDDDD      ears full width
//   DDDDFFFDDFFFFDDFFFDDDD      eyes (2×2)
//   DDDDFFFDDFFFFDDFFFDDDD
//   DDDDFFFFFFFFFFFFFFDDDD
//   DDDDFFFFCCDDCCFFFFDDDD      muzzle + nose (2×2)
//   DDDDFFFCCCDDCCCFFFDDDD
//   DDDFFFCCCCCCCCCCFFFDDD      ears taper
//   DDFFFFCCCCCCCCCCFFFFDD      ear tips
//   .....FFFCCCCCCFFF.....      chin
//   .......CCPPPPCC.......      tongue
//   .........PPPP.........
//
//   🐾 woof! · pies vX.Y.Z 🐾
//
// One blank line pads the top (like the built-in header's spacing).
// Brand colors stay fixed across themes (like the pi logo); they follow the
// terminal's color mode (truecolor / 256-color). Apple Terminal misaligns
// half-blocks, so it gets the single-emoji fallback. Run /builtin-header to
// restore the stock header (logo + keybinding hints).

import { VERSION, type ExtensionAPI, type Theme } from "@earendil-works/pi-coding-agent";
import {
	backgroundAnsi,
	foregroundAnsi,
	isAppleTerminalSession,
	rgbColor,
	type TerminalColorMode,
} from "@earendil-works/pi-tui";

const RESET = "\x1b[0m";
/** Fixed left indent for the art and the subtitle. */
const INDENT = "  ";
/** Art width in terminal cells (pixels / 2). */
const ART_WIDTH = 22;

/** Fixed brand palette (not theme-derived, like the pi logo's coral/blue/yellow). */
const FUR = rgbColor(232, 167, 92); // warm orange — coat
const CREAM = rgbColor(246, 231, 206); // muzzle
const DARK = rgbColor(58, 46, 38); // floppy ears + eyes + nose
const PINK = rgbColor(232, 132, 126); // tongue

type Pixel = typeof FUR | typeof CREAM | typeof DARK | typeof PINK | null;

const PIXELS: Record<string, Pixel> = {
	F: FUR,
	C: CREAM,
	D: DARK,
	P: PINK,
};

/** 22×14 grid, two pixel rows per terminal line. "." = transparent. */
const DOG_PIXELS = [
	"......FFFFFFFFFF......",
	"....FFFFFFFFFFFFFF....",
	".DDFFFFFFFFFFFFFFFFDD.",
	"DDDDFFFFFFFFFFFFFFDDDD",
	"DDDDFFFDDFFFFDDFFFDDDD",
	"DDDDFFFDDFFFFDDFFFDDDD",
	"DDDDFFFFFFFFFFFFFFDDDD",
	"DDDDFFFFCCDDCCFFFFDDDD",
	"DDDDFFFCCCDDCCCFFFDDDD",
	"DDDFFFCCCCCCCCCCFFFDDD",
	"DDFFFFCCCCCCCCCCFFFFDD",
	".....FFFCCCCCCFFF.....",
	".......CCPPPPCC.......",
	".........PPPP.........",
];

/** One terminal cell from two stacked pixels: ▀ top half in fg, bottom in bg. */
function cell(upper: Pixel, lower: Pixel, mode: TerminalColorMode): string {
	if (upper && lower) return `${foregroundAnsi(upper, mode)}${backgroundAnsi(lower, mode)}▀${RESET}`;
	if (upper) return `${foregroundAnsi(upper, mode)}▀${RESET}`;
	if (lower) return `${foregroundAnsi(lower, mode)}▄${RESET}`;
	return " ";
}

/** The pixel grid as terminal lines (22 cells wide, 7 lines). */
function dogArt(mode: TerminalColorMode): string[] {
	const lines: string[] = [];
	for (let row = 0; row < DOG_PIXELS.length; row += 2) {
		const top = DOG_PIXELS[row]!;
		const bottom = DOG_PIXELS[row + 1] ?? "";
		let line = "";
		for (let col = 0; col < ART_WIDTH; col++) {
			const upper = PIXELS[top[col] ?? "."] ?? null;
			const lower = PIXELS[bottom[col] ?? "."] ?? null;
			line += cell(upper, lower, mode);
		}
		lines.push(line);
	}
	return lines;
}

function dogHeaderLines(theme: Theme, width: number): string[] {
	const mode = theme.getColorMode();
	// Paws stay bare (color ANSI over emoji renders dark in most terminals);
	// only the text takes muted/dim. 🐶 flanks — 🐾 reads dark brown.
	const subtitle = `🐶 ${theme.fg("muted", "woof!")} ${theme.fg("dim", `· pies v${VERSION}`)} 🐶`;

	// Apple Terminal draws gaps between rows and misaligns half-blocks —
	// same reason pi falls back to its text wordmark there. Too narrow for
	// the art (indent + 22 cells) falls back to the emoji. Paw emojis take
	// no color codes (colored ANSI on emoji renders dark in most terminals
	// — see the subtitle note below), so the fallback keeps plain 🐶.
	if (isAppleTerminalSession() || width < INDENT.length + ART_WIDTH) {
		return [`${INDENT}🐶`, `${INDENT}${subtitle}`];
	}

	return ["", ...dogArt(mode).map((line) => INDENT + line), "", INDENT + subtitle];
}

export default function dogHeader(pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		if (ctx.mode !== "tui") return; // print/JSON/RPC modes keep the default
		ctx.ui.setHeader((_tui, theme) => ({
			render(width: number): string[] {
				// Every rendered line fits the width: indent (2) + art (22) = 24.
				return dogHeaderLines(theme, width);
			},
			invalidate() {},
		}));
	});

	// Restore the stock header (logo + keybinding hints) on demand.
	pi.registerCommand("builtin-header", {
		description: "Restore built-in pi header",
		handler: async (_args, ctx) => {
			ctx.ui.setHeader(undefined);
			ctx.ui.notify("Built-in header restored", "info");
		},
	});
}