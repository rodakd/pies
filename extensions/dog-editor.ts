// Dog editor — 🐶 emoji to the left of the prompt input.
//
// Vendored at ~/repos/pies/extensions/dog-editor.ts, symlinked to
// ~/.pi/agent/extensions/dog-editor.ts (auto-discovered, user scope).
// Pattern from the official example examples/extensions/modal-editor.ts
// @ 1.5.2: subclass CustomEditor, register via ctx.ui.setEditorComponent.
// After editing, run /reload inside Pi to hot-reload the change.
//
// Rendered shape (first content row gets the dog, continuation rows stay
// column-aligned via blank prefix):
//
//   ─────────────────────────
//    🐶 type here
//      wrapped continuation
//   ─────────────────────────
//
// - Constructor passes { embedWorkingStatus: true } so the working spinner
//   stays embedded in the editor top border, same as the default editor
//   (the app duck-types `embedWorkingStatus === true` to wire it up).
//   paddingX / autocompleteMaxVisible / borderColor / autocomplete provider
//   are copied onto the new editor by the app after construction.
// - Click-to-cursor mapping is compensated: content rows are shifted right
//   by PREFIX_WIDTH, so clicks shift x back before delegating.
// - Border rows ignore x; autocomplete popup rows (y >= content + 2) are
//   untouched.

import { CustomEditor, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

const PREFIX = "🐶 ";
const PREFIX_WIDTH = visibleWidth(PREFIX);

class DogEditor extends CustomEditor {
	/** Rendered content rows: index 1..renderedVisibleLineCount (set by super.render). */
	private get contentRowCount(): number {
		return (this as unknown as { renderedVisibleLineCount?: number }).renderedVisibleLineCount ?? 0;
	}

	render(width: number): string[] {
		const lines = super.render(width);
		const content = this.contentRowCount;
		for (let i = 1; i <= content && i < lines.length; i++) {
			const prefix = i === 1 ? PREFIX : " ".repeat(PREFIX_WIDTH);
			// Keep the row within width: cutting the right edge only drops padding spaces
			// (or tail glyphs on completely full rows).
			lines[i] = truncateToWidth(prefix + lines[i], width, "");
		}
		return lines;
	}

	handleMouse(event: Parameters<CustomEditor["handleMouse"]>[0]) {
		const content = this.contentRowCount;
		// First content row through last content row are prefixed; popup rows start
		// after the bottom border (y >= content + 2) and stay unshifted.
		if (event.y >= 1 && event.y <= content) {
			event = { ...event, x: Math.max(0, event.x - PREFIX_WIDTH) };
		}
		return super.handleMouse(event);
	}
}

export default function dogEditor(pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		if (!ctx.hasUI) return; // print/JSON mode: no editor
		// Compose with any previously registered custom editor factory
		// (docs/extensions.md "Custom editors"): we replace the factory; the app
		// copies state (text, padding, autocomplete, handlers) onto the new editor.
		ctx.ui.setEditorComponent((tui, theme, keybindings) => new DogEditor(tui, theme, keybindings, { embedWorkingStatus: true }));
	});
}