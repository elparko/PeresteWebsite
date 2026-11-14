export interface FooterScene {
  /* Path without extension. The footer loads <src>.webp, <src>-1200.webp and <src>.jpg,
     and <src>-phone.webp and <src>-phone.jpg on narrow screens. */
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
export const footerLayout: FooterLayout = "band";

const scenes = {
  lighthouse: {
    src: "/images/art/footer-lighthouse",
    alt: "A pastel painting of a white lighthouse above a dark-blue harbour town, with a band of teal sea and sunlit clouds in a wide sky.",
    width: 2400,
    height: 800,
    focus: "44% 50%",
  },
  harbour: {
    src: "/images/art/footer-harbour",
    alt: "A pastel painting of a harbour town on a hill and a white lighthouse on a mole, seen across teal water with small boats at their moorings.",
    width: 2400,
    height: 800,
    focus: "76% 50%",
  },
  "open-sea": {
    src: "/images/art/footer-open-sea",
    alt: "An oil painting of the sea at evening: a low sun lays a road of light across the swell, with a tiny lighthouse on a spit at the horizon.",
    width: 2400,
    height: 800,
    focus: "55% 50%",
  },
  marsh: {
    src: "/images/art/footer-marsh",
    alt: "An ink and wash painting of a marsh at first light: an egret stands in the shallows before a pale sun, with reeds in dark ink and a lighthouse faint on the far shore.",
    width: 2400,
    height: 800,
    focus: "43% 50%",
  },
} satisfies Record<string, FooterScene>;

/* One scene per section of the site, matched by the start of the path. The
   first match wins, so a page always shows the same painting. Add a scene
   above, then name it here. */
const bySection: { prefix: string; scene: keyof typeof scenes }[] = [
  { prefix: "/guide/", scene: "marsh" },
  { prefix: "/research/", scene: "harbour" },
  { prefix: "/about/", scene: "open-sea" },
  { prefix: "/careers/", scene: "open-sea" },
  { prefix: "/press/", scene: "open-sea" },
];

export function footerSceneFor(pathname: string): FooterScene {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const match = bySection.find((s) => path.startsWith(s.prefix));
  return scenes[match?.scene ?? "lighthouse"];
}
