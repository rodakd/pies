// Working-words loader — rotating gerunds in the "Working" indicator.
//
// Vendored at ~/repos/pies/extensions/working-words.ts, symlinked to
// ~/.pi/agent/extensions/working-words.ts (auto-discovered, user scope).
// Claude-Code-style silly gerunds ("Bamboozling…") rotating above the prompt.
// After editing, run /reload inside Pi to hot-reload the change.
//
// Uses ctx.ui.setWorkingMessage(message) (docs/extensions.md, Extension UI):
// the WorkingStatusIndicator (Loader) renders `<spinner> <message>` in the
// row above the prompt — embedded in the editor top border with our DogEditor
// ({ embedWorkingStatus: true }). setMessage() does NOT reset the spinner,
// so the default loader animation (theme-accent braille frames, ~80ms)
// keeps spinning while this rotates the message every 3s:
//
//   ── ⠋ Bamboozling… ──────────────
//    🐶 prompt input here
//
// A new run's first turn_start starts the rotation; agent_settled stops it
// and restores the default message. Per docs "Long-lived resources and
// shutdown": no timers from the factory; session_shutdown clears idempotently.
// (The footer/elapsed-timer status line lives in status-line.ts — words are
// only here, not in the status line.)

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Just the surface this extension uses (structurally compatible with ctx.ui). */
type WorkingUI = {
	setWorkingMessage: (message: string | undefined) => void;
};

const WORD_INTERVAL_MS = 3000;

const WORDS = [
	"Bamboozling", "Absquatulating", "Ballyhooing", "Blatherskiting", "Brouhahaing",
	"Caterwauling", "Codswalloping", "Confabulating", "Dilly-dallying", "Finagling",
	"Flimflamming", "Flibbertigibbeting", "Frobnicating", "Hornswoggling", "Kerfuffling",
	"Lollygagging", "Malarkeying", "Meandering", "Moseying", "Noodling",
	"Percolating", "Pettifogging", "Rigmaroling", "Shenaniganning", "Skedaddling",
	"Skulduggering", "Snollygostering", "Tomfoolering", "Wibbling", "Woolgathering",
];

function shuffle<T>(arr: readonly T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export default function workingWords(pi: ExtensionAPI) {
	let ui: WorkingUI | undefined;
	let timer: ReturnType<typeof setInterval> | undefined;
	let words = shuffle(WORDS); // shuffled rotation, reshuffled per pass
	let wordIndex = 0;

	function stopRotation() {
		if (timer) clearInterval(timer);
		timer = undefined;
	}

	function currentWord(): string {
		if (wordIndex >= words.length) {
			words = shuffle(WORDS);
			wordIndex = 0;
		}
		return words[wordIndex++]!;
	}

	function startRotation() {
		stopRotation();
		if (!ui) return;
		ui.setWorkingMessage(`${currentWord()}…`);
		timer = setInterval(() => {
			ui?.setWorkingMessage(`${currentWord()}…`);
		}, WORD_INTERVAL_MS);
	}

	pi.on("session_start", async (_event, ctx) => {
		ui = ctx.ui as WorkingUI;
		stopRotation();
		ctx.ui.setWorkingMessage(undefined); // default "Working" while idle
	});

	// First turn of a run starts the rotation; later turns keep it running.
	pi.on("turn_start", async () => {
		if (!timer) startRotation();
	});

	pi.on("agent_settled", async (_event, ctx) => {
		stopRotation();
		ctx.ui.setWorkingMessage(undefined);
	});

	// Idempotent cleanup for session-scoped resources (the rotation timer).
	pi.on("session_shutdown", async () => {
		stopRotation();
	});
}