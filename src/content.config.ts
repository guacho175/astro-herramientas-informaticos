import { defineCollection, z } from 'astro:content';

const tutorials = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string({
      required_error: "El título del tutorial es requerido para el agente.",
    }),
    description: z.string({
      required_error: "La descripción corta es requerida.",
    }),
    slug: z.string().optional(),
    category: z.string().optional().default("General"),
    image: z.string().optional().default("/images/tutorials/astro-icon-dark.png"),
    updated: z.string().optional().default("Jul 2026"),
  }),
});

export const collections = {
  tutorials,
};
