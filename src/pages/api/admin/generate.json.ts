import { aiGeneratorService } from '../../../lib/application/services/AIGeneratorService';
import { tutorialService } from '../../../lib/application/services/TutorialService';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { topic, password } = body;

    // Hardcoded password for basic protection
    const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD || 'admin123';
    
    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Acceso no autorizado.' }), { status: 401 });
    }

    if (!topic) {
      return new Response(JSON.stringify({ error: 'El tema es obligatorio.' }), { status: 400 });
    }

    // 1. Generar contenido con IA (Cascade Fallback)
    console.log(`[Admin API] Iniciando generación para el tema: ${topic}`);
    const generatedData = await aiGeneratorService.generateTutorial(topic);

    // Generar un slug simple basado en el título
    const slug = generatedData.title
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // 2. Insertar en Supabase
    const tutorialPayload = {
      slug,
      title: generatedData.title,
      description: generatedData.description,
      category: generatedData.category,
      content_markdown: generatedData.content_markdown,
      image: `/images/tutorials/${slug}.png`, // Placeholder image
      views: 0
    };

    const inserted = await tutorialService.createTutorial(tutorialPayload);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Tutorial generado y guardado exitosamente.',
      data: inserted
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('[Admin API] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor', 
      details: error.message 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
