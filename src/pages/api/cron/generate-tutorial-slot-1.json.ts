import type { APIRoute } from 'astro';
import { handleTutorialCron } from './generate-tutorials.json';

export const GET: APIRoute = async ({ request }) => handleTutorialCron(request, 1);

export const maxDuration = 300;
