import type { CSSProperties } from "react";

const DEFAULT_ACCENT = "#5b3cc4";

function isValidHex(color: string): boolean {
  return /^#([0-9a-f]{6})$/i.test(color);
}

/** Darkens a hex color by `amount` (0–1) — used for the hover shade, same relationship as --primary/--primary-hover in globals.css. */
function darkenHex(hex: string, amount: number): string {
  const value = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(value.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(value.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(value.slice(4, 6), 16) * (1 - amount)));
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Overrides the `--primary`/`--primary-hover` CSS custom properties
 * globals.css already defines, via inline style on a wrapping element —
 * no new design tokens, no per-component color prop. An invalid or
 * missing accent color falls back to the current FIDE purple untouched.
 */
export function getAccentColorStyle(accentColor: string | null | undefined): CSSProperties {
  const color = accentColor && isValidHex(accentColor) ? accentColor : DEFAULT_ACCENT;
  return {
    "--primary": color,
    "--primary-hover": darkenHex(color, 0.14),
  } as CSSProperties;
}
