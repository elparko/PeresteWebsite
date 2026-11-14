export interface SocialCard {
  title?: string;
  description?: string;
  image: string;
  alt: string;
}

// The lighthouse painting. Every page uses it as its link preview picture,
// with the page's own title and description, unless the page is listed below.
const painting: SocialCard = {
  image: "/social/pereste.jpg",
  alt: "A pastel painting of a white lighthouse above a dark-blue harbour town, a band of teal sea and a large sky with a sunlit cloud.",
};

const atlas = {
  image: "/social/medication-neuron-atlas.jpg",
  alt: "A pastel painting of a white lighthouse above a dark-blue harbour town, a band of teal sea and a large sky with a sunlit cloud. Some of the town's windows glow in five colours.",
};

// Pages with their own, shorter card text.
const cards: Record<string, SocialCard> = {
  "/research/medication-neuron-atlas/browse/": {
    ...atlas,
    title: "Medication neuron atlas",
    description:
      "Browse what each unit of an open language model responds to in FDA drug label text. Not guidance for patient care.",
  },
  "/research/medication-neuron-atlas/": {
    ...atlas,
    title: "A neuron atlas of medication text",
    description:
      "A searchable map of where a model's 884,736 units respond to drug names, doses, routes and frequencies.",
  },
};

export function socialCardFor(pathname: string): SocialCard {
  return cards[pathname.endsWith("/") ? pathname : `${pathname}/`] ?? painting;
}
