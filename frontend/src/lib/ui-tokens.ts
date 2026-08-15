// Planly design system — shared class primitives every page should reuse
// instead of inventing its own spacing/radius/color combination. Not a
// component library, just the small set of decisions ("what does a primary
// button look like") that were previously copy-pasted (and drifting)
// per-file. Extend this file rather than hand-rolling a new variant inline.
//
// Scale, at a glance:
//  - radius:  panels/major containers 2xl (16px) · secondary panels xl (12px)
//             · buttons/inputs lg (8px) · small chips/badges md (6px) · pills full
//  - color:   near-black/gray/white in dark mode (canvas/panel/surface/surface-2/ink*),
//             existing gray-* scale in light mode. One accent — orange — used only
//             for the single primary action per view and a few small indicators
//             (today, active nav, selection). Never a second chromatic color for
//             structure (status dots stay muted; see calendar-colors.ts, unchanged).
//  - borders: hairline only — `border-gray-100 dark:border-white/8` (or `/[0.06]`
//             for the quietest internal dividers). No heavy/colored borders.
//  - shadow:  `shadow-sm` at most, and only in light mode — dark mode gets
//             separation from tonal contrast (surface vs surface-2), not shadow.
//  - cards:   used only where they truly separate distinct information (a panel,
//             a list container). Never wrap a single stat/row/line in its own
//             bordered box just for symmetry — prefer spacing ("air") instead.

export const PANEL = "rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none";
export const SUBPANEL = "rounded-xl border border-gray-100 bg-white shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none";

/** The one filled, chromatic action per view. Never more than one on screen at a time. */
export const BUTTON_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-white " +
  "transition-colors duration-150 hover:bg-accent/90 active:bg-accent/80 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-canvas " +
  "disabled:pointer-events-none disabled:opacity-40";

/** Outlined, neutral — secondary actions (Cancel, Add another, etc). */
export const BUTTON_SECONDARY =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-600 " +
  "transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100 " +
  "dark:border-white/8 dark:text-ink-dim dark:hover:bg-surface-2 " +
  "disabled:pointer-events-none disabled:opacity-40";

/** No border/fill — icon buttons, tertiary text actions, row-level "..." menus. */
export const BUTTON_GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 " +
  "transition-colors duration-150 hover:bg-gray-100 active:bg-gray-200 " +
  "dark:text-ink-faint dark:hover:bg-surface-2 " +
  "disabled:pointer-events-none disabled:opacity-40";

/** Destructive — delete/remove actions. Kept text-only until hovered, never a filled red button. */
export const BUTTON_DANGER =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-500 " +
  "transition-colors duration-150 hover:bg-red-50 dark:hover:bg-red-500/10";

export const INPUT =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 " +
  "focus:outline-none focus:border-gray-300 dark:border-white/8 dark:bg-surface-2 dark:text-ink dark:placeholder:text-ink-faint dark:focus:border-white/20";

export const LABEL = "mb-1 block text-xs font-medium text-gray-500 dark:text-ink-dim";

export const HAIRLINE = "border-gray-100 dark:border-white/8";
export const HAIRLINE_FAINT = "border-gray-50 dark:border-white/[0.06]";
