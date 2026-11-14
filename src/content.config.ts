import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const research = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/research" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.string().default("Pereste Health"),
    tag: z.string().default("Research"),
    draft: z.boolean().default(false),
    toc: z.boolean().default(true),
    hero: z.boolean().default(false),
    links: z
      .array(z.object({ label: z.string(), href: z.string(), primary: z.boolean().default(false) }))
      .default([]),
    figure: z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() }).optional(),
  }),
});

export const collections = { research };
