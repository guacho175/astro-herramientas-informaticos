import { defineCollection, z } from "astro:content";

const tutorialsCollection = defineCollection({
  type: "content", // obligatorio
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    image: z.string().url(),
    updated: z.string(),
  }),
});

export const collections = {
  tutorials: tutorialsCollection,
};
