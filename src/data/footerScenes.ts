export interface FooterScene {
  /* Path without extension; the footer adds .webp and .jpg, and "-phone" for narrow screens. */
  src: string;
  alt: string;
  width: number;
  height: number;
  /* Where the subject sits in the wide image, as a CSS object-position. */
  focus: string;
}

export type FooterLayout = "wash" | "band";

/* "wash": the painting sits pale behind the footer's links.
   "band": the links sit on white, and the painting is a full-color band below them. */
export const footerLayout: FooterLayout = "wash";

const scenes = {
  lighthouse: {
    src: "/images/art/footer-lighthouse",
    alt: "A pastel painting of a white lighthouse above the dark roofs of a town by the sea, under large sunlit clouds. Some of the town's windows glow in five colours.",
    width: 2400,
    height: 800,
    focus: "34% 50%",
  },
} satisfies Record<string, FooterScene>;

/* One scene per section of the site, matched by the start of the path. The
   first match wins, so a page always shows the same painting. Add a scene
   above, then name it here. */
const bySection: { prefix: string; scene: keyof typeof scenes }[] = [
  { prefix: "/guide/", scene: "lighthouse" },
  { prefix: "/research/", scene: "lighthouse" },
  { prefix: "/about/", scene: "lighthouse" },
];

export function footerSceneFor(pathname: string): FooterScene {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const match = bySection.find((s) => path.startsWith(s.prefix));
  return scenes[match?.scene ?? "lighthouse"];
}
