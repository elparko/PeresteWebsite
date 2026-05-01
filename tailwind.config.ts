import type { Config } from "tailwindcss";

/**
 * Pereste brand tokens.
 *
 * Brandmark is monochromatic black on white, with periwinkle/lavender
 * as the single accent color (used in the brandkit templates and the
 * inverse logo variant).
 *
 *   ink         true black, matches the logo strokes
 *   surface     clean white, matches the lockup background
 *   subtle      very faint lavender wash for alternating sections
 *   accent      brand lavender (the periwinkle from the brandkit)
 *   accent-soft lighter lavender, for chips, hovers, gradient washes
 *   muted       cool gray for secondary text
 *   line        lavender-tinted hairline border
 */
const config: Config = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#0A0A0A",
          surface: "#FFFFFF",
          subtle: "#F7F6FC",
          muted: "#6B6B7A",
          line: "#E8E6F2",
          accent: "#C9C7F4",
          "accent-soft": "#E8E7FA",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          "Newsreader",
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
        display: [
          "Outfit",
          "Inter",
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
