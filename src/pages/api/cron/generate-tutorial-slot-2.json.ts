import type { APIRoute } from 'astro';
import { handleTutorialCron } from './generate-tutorials.json';

export const GET: APIRoute = async ({ request }) => handleTutorialCron(request, 2);

export const maxDuration = 300;
