/**
 * The panels are translucent rather than solid, so anything scrolling behind
 * them shows through softened. `supports-[backdrop-filter]` keeps the panel
 * opaque enough to read on the browsers that ignore the blur, instead of
 * leaving pale text on a pale page.
 */
export const GLASS =
  "border border-line-strong/60 bg-surface/88 supports-[backdrop-filter]:bg-surface/55 supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-150";

export const BAR_ICON =
  "rounded-[8px] p-2 text-ink transition-colors duration-150 ease-out hover:bg-surface-hover";

/** A fixed height rather than padding, so every wallet state lines up at 42px. */
export const PILL =
  "inline-flex h-[42px] items-center rounded-[8px] bg-accent px-4 text-sm font-medium text-ink-inverse transition-colors duration-150 ease-out hover:bg-accent-hover";
