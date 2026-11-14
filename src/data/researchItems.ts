export interface ResearchItem {
  href: string;
  models: string;
  title: string;
  line: string;
  date: string;
  kind: "Atlas" | "Paper" | "Study";
  image?: string;
  alt?: string;
  glyph?: "open-capsule";
}

/* The published research, newest first. One list feeds the home page band and
   the research index, so the two never disagree. */
export const researchItems: ResearchItem[] = [
  {
    href: "/research/medication-neuron-atlas/",
    models: "Qwen3-8B",
    title: "Medication neuron atlas",
    line: "A searchable map of where one model's 884,736 units respond to drug names, doses, routes and frequencies.",
    date: "2026-11-13",
    kind: "Atlas",
    image: "/images/research/tile-atlas.webp",
    alt: "Dots for the atlas's units, grouped under the words warfarin, 5, mg, orally and once daily, stacked by depth in the model.",
  },
  {
    href: "/research/dosegate/",
    models: "Qwen3.5-4B · MedGemma 4B · Llama 3.2 3B · four Claude models",
    title: "DoseGate",
    line: "An output layer that fills every medication reference from the patient's medication orders or blocks the output.",
    date: "2026-11-05",
    kind: "Paper",
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
    alt: "A chart of what each reply does for the person, from the advice versus education study.",
  },
];
