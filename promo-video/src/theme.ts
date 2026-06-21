/**
 * Promo video theme — light / sophisticated palette.
 *
 * Inspired by muted neutrals with a berry undertone:
 *   almond-silk       #d3bdb0  (lightest bg)
 *   khaki-beige       #c1ae9f  (surface / cards)
 *   dusty-olive       #89937c  (borders, brand start)
 *   taupe-grey        #715b64  (muted text, brand mid)
 *   blackberry-cream  #69385c  (primary text, brand end — darkest)
 */

export const theme = {
  // ——— Backgrounds ———
  bg: "#d3bdb0",
  surface: "#c1ae9f",
  surfaceRgb: "193, 174, 159",

  // ——— Borders ———
  border: "#89937c",
  borderRgb: "137, 147, 124",

  // ——— Text (darker = better contrast on light bg) ———
  textPrimary: "#69385c",
  textMuted: "#715b64",
  textSubtle: "#89937c",

  // ——— Brand / accent ———
  brandFrom: "#89937c",
  brandMid: "#715b64",
  brandTo: "#69385c",
  brandFromRgb: "137, 147, 124",
  brandMidRgb: "113, 91, 100",
  brandToRgb: "105, 56, 92",

  // ——— Per-feature accent gradient pairs ———
  featureGradients: {
    planEditor: { from: "#89937c", to: "#715b64" },
    sessionProgress: { from: "#715b64", to: "#69385c" },
    restTimer: { from: "#89937c", to: "#69385c" },
    history: { from: "#715b64", to: "#69385c" },
  },
} as const;

export type Theme = typeof theme;
