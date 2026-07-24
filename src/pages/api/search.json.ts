import { tutorialService } from '../../lib/application/services/TutorialService';

export const prerender = true;

export async function GET() {
  const tutorials = await tutorialService.getTutorialCatalog();
  
  const searchIndex = tutorials.map((tut) => ({
    title: tut.title,
    description: tut.description,
    slug: tut.slug,
    category: tut.category,
    image: tut.image,
    updated: new Date(tut.created_at).getFullYear(),
  }));

  return new Response(JSON.stringify(searchIndex), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
