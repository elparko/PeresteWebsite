export interface SocialCard {
  title: string;
  description: string;
  image: string;
  alt: string;
}

const lighthouse = {
  image: "/social/medication-neuron-atlas.jpg",
  alt: "A pastel painting of a white lighthouse above a dark-blue harbour town, a band of teal sea and a large sky with a sunlit cloud. Some of the town's windows glow in five colours.",
};

const cards: Record<string, SocialCard> = {
  "/research/medication-neuron-atlas/browse/": {
    ...lighthouse,
    title: "Medication neuron atlas",
    description:
      "Browse what each unit of an open language model responds to in FDA drug label text. Not guidance for patient care.",
  },
  "/research/medication-neuron-atlas/": {
    ...lighthouse,
    title: "A neuron atlas of medication text",
    description:
      "A searchable map of where a model's 884,736 units respond to drug names, doses, routes and frequencies.",
  },
};

export function socialCardFor(pathname: string): SocialCard | undefined {
  return cards[pathname.endsWith("/") ? pathname : `${pathname}/`];
}
