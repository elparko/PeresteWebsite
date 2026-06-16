import type { Config } from "tailwindcss";

/**
 * Pereste Health brand tokens.
 *
 * The brand is the lighthouse mark — deep navy and teal, with an indigo
 * mid-tone — over clean white and a cool light-gray wash. Typeface is
 * Montserrat throughout (medium for the wordmark, semibold/bold for
 * headings, regular for body).
 *
 *   ink          deep navy — primary text and dark sections (logo navy)
 *   indigo       brand blue mid-tone — the wordmark color, secondary accent
 *   surface      clean white
 *   subtle       cool light-gray wash for alternating sections
 *   muted        cool slate-gray for secondary text
 *   line         faint cool hairline border
 *   accent       teal — primary accent (the beam / path color)
 *   accent-soft  pale teal wash for chips, hovers, gradient glows
 *   teal-light   lighter teal, for gradients and highlights
 *   teal-pale    palest teal, for beams and soft fills
 */
const config: Config = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#232C54",
          navy: "#232C54",
          indigo: "#3F518F",
          surface: "#FFFFFF",
          subtle: "#F1F4F7",
          muted: "#5A6472",
          line: "#E3E8EF",
          accent: "#0F9BA8",
          "accent-soft": "#E6F4F6",
          "teal-light": "#4FC3D0",
          "teal-pale": "#8CCFDB",
        },
      },
      fontFamily: {
        sans: [
          "Montserrat",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        // Headings use the same Montserrat stack at heavier weights.
        display: [
          "Montserrat",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        // Kept as an alias so any lingering `font-serif` utilities still
        // resolve to the brand typeface rather than a system serif.
        serif: [
          "Montserrat",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      letterSpacing: {
        "tight-2": "-0.02em",
        "tight-3": "-0.03em",
        "wide-3": "0.18em",
        "wide-4": "0.24em",
      },
      maxWidth: {
        prose: "68ch",
        page: "76rem",
      },
    },
  },
  plugins: [],
};

export default config;
