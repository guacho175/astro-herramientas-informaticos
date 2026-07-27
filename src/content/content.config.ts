import { defineCollection, z } from "astro:content";

const tutorialsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string().optional(),
    category: z.string().optional().default("General"),
    image: z.string().optional().default("/images/tutorials/astro-icon-dark.png"),
    updated: z.string().optional().default("Jul 2026"),
  }),
});

export const collections = {
  tutorials: tutorialsCollection,
};
