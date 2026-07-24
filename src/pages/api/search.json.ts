import { getCollection } from 'astro:content';

export const prerender = true;

export async function GET() {
  const tutorials = await getCollection('tutorials');
  
  const searchIndex = tutorials.map((tutorial) => ({
    slug: tutorial.slug,
    title: tutorial.data.title,
    description: tutorial.data.description,
    image: tutorial.data.image,
    updated: tutorial.data.updated,
  }));

  return new Response(JSON.stringify(searchIndex), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
