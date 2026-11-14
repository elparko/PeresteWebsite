export interface ResearchItem {
  href: string;
  models: string;
  title: string;
  line: string;
  date: string;
  kind: "Atlas" | "Paper" | "Study" | "Findings";
  image?: string;
  alt?: string;
  /* The animated text-art piece for the tile, with `alt` as its label. `image` is the still
     shown when scripts are off. */
  glyph?: "open-capsule" | "dose-steps" | "atlas-units" | "atlas-kinds" | "advice-reply" | "advice-seam";
  /* A second piece under review: the research index shows it in place of `glyph`. */
  glyphIndex?: "open-capsule" | "dose-steps" | "atlas-units" | "atlas-kinds" | "advice-reply" | "advice-seam";
  altIndex?: string;
}

/* The published research, newest first. One list feeds the home page band and
   the research index, so the two never disagree. */
export const researchItems: ResearchItem[] = [
  {
    href: "/research/what-a-model-learned-about-a-dose/",
    models: "Qwen3-8B",
    title: "What has a language model learned about a dose?",
    line: "At which of its 36 processing steps Qwen3-8B has units for each part of a dosing instruction, and which parts of a drug label it has clear units for.",
    date: "2026-11-14",
    kind: "Findings",
    image: "/images/research/tile-dose.webp",
    alt: "The words warfarin, 5, mg, orally and once daily, each hanging below its place in the instruction at the depth of the processing step where the model's units for that kind of word appear. Warfarin hangs near the top and the 5 hangs far below the rest.",
    glyph: "dose-steps",
  },
  {
    href: "/research/medication-neuron-atlas/",
    models: "Qwen3-8B",
    title: "Medication neuron atlas",
    line: "A searchable map of where the 884,736 units of Qwen3-8B respond to drug names, doses, routes and frequencies in FDA drug labels. It maps responses and does not test the model's advice.",
    date: "2026-11-13",
    kind: "Atlas",
    image: "/images/research/tile-atlas.webp",
    alt: "A name plate for one unit of the model, with the words it fires on lit in the drug label text around it, for three units in turn.",
    glyph: "atlas-units",
    altIndex: "Drug label text in which drug names, doses, routes and frequencies are picked out as tiles, each kind in its own color.",
    glyphIndex: "atlas-kinds",
  },
  {
    href: "/research/dosegate/",
    models: "Qwen3.5-4B · MedGemma 4B · Llama 3.2 3B · four Claude models",
    title: "DoseGate",
    line: "An output layer that fills each dose, route and frequency from the patient's medication orders, or blocks the output.",
    date: "2026-11-05",
    kind: "Paper",
    alt: "A capsule shape picked out in tiles from a field of medicine label words.",
    glyph: "open-capsule",
  },
  {
    href: "/research/advice-vs-education/",
    models: "Qwen3.5-4B",
    title: "Advice versus education",
    line: "A study of whether a chat model's internal state separates a request for medical advice from a request for medical education.",
    date: "2026-11-04",
    kind: "Study",
    image: "/images/research/tile-advice.webp",
    alt: "The question what should I take, with two replies: one tells the person to contact a healthcare provider, and one explains what a cough with yellow phlegm is typically a sign of. The explanation takes the place of the first reply.",
    glyph: "advice-reply",
    altIndex: "A field of short requests worded as advice on one side of a seam of tiles and as education on the other, crossed by one dark row of emergency words that reads the same on both sides.",
    glyphIndex: "advice-seam",
  },
];
