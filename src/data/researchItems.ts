export interface ResearchItem {
  href: string;
  models: string;
  title: string;
  line: string;
  date: string;
  kind: "Atlas" | "Paper" | "Study" | "Findings";
  image?: string;
  alt?: string;
  glyph?: "open-capsule";
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
    alt: "A three-dimensional volume of points, one for each unit, stacked by processing step from 1 to 36, with the 1,648 units for drug names lit on a plane near step 6 and the words warfarin, 5, mg, orally and once daily listed beside it.",
  },
  {
    href: "/research/medication-danger-and-control/",
    models: "Qwen3-8B · Qwen3.5-4B",
    title: "Do the units that predict a message's danger control the model's urgency reading?",
    line: "Switching off the units that best predicted a message's danger left more than 99% of the gap between the model's urgency readings for dangerous and harmless messages in place.",
    date: "2026-11-14",
    kind: "Findings",
    image: "/images/research/tile-danger-ladder.webp",
    alt: "A bar chart of six ways of changing the model's state at the reply position and how much each changed the urgency gap. Replacing the whole reply position and replacing only the attention output each lowered the gap by 1.86. Replacing all 294,912 feed-forward neurons changed it by +0.025, and silencing 200 chosen units changed it by +0.005 and by −0.027.",
  },
  {
    href: "/research/medication-neuron-atlas/",
    models: "Qwen3-8B",
    title: "Medication neuron atlas",
    line: "A searchable map of where the 884,736 units of Qwen3-8B respond to drug names, doses, routes and frequencies in FDA drug labels. It maps responses and does not test the model's advice.",
    date: "2026-11-13",
    kind: "Atlas",
    image: "/images/research/tile-atlas.webp",
    alt: "Dots for the atlas's units, grouped under the words warfarin, 5, mg, orally and once daily, stacked by depth in the model.",
  },
  {
    href: "/research/dosegate/",
    models: "Qwen3.5-4B · MedGemma 4B · Llama 3.2 3B · four Claude models",
    title: "DoseGate",
    line: "An output layer that fills each dose, route and frequency from the patient's medication orders, or blocks the output.",
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
