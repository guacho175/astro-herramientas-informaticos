import type { APIRoute } from 'astro';
import { DailyTutorialService } from '../../../lib/application/services/DailyTutorialService';
import { vercelAIGeneratorService } from '../../../lib/application/services/VercelAIGeneratorService';
import { tutorialAdminRepository } from '../../../lib/infrastructure/repositories/TutorialAdminRepository';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function handleTutorialCron(
  request: Request,
  startingSlot: number,
  count = 1,
): Promise<Response> {
  const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[Cron Tutoriales] CRON_SECRET no está configurado.');
    return json({ success: false, error: 'El cron no está configurado.' }, 500);
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return json({ success: false, error: 'No autorizado.' }, 401);
  }

  if (
    !Number.isInteger(startingSlot)
    || !Number.isInteger(count)
    || startingSlot < 1
    || count < 1
    || startingSlot + count - 1 > 2
  ) {
    return json({ success: false, error: 'El rango de slots debe quedar entre 1 y 2.' }, 400);
  }

  try {
    const service = new DailyTutorialService(vercelAIGeneratorService, tutorialAdminRepository);
    const run = await service.run(new Date(), count, 'tutorial-emergente', startingSlot);

    if (run.failed === run.requested) {
      return json({ success: false, message: 'No se pudo generar ningún tutorial.', ...run }, 500);
    }

    if (run.failed > 0) {
      return json({ success: false, message: 'La ejecución terminó parcialmente.', ...run }, 207);
    }

    return json({ success: true, message: 'Ejecución diaria completada.', ...run }, 200);
  } catch {
    console.error('[Cron Tutoriales] La ejecución diaria terminó con un error no controlado.');
    return json({ success: false, error: 'Error interno durante la ejecución diaria.' }, 500);
  }
}

export const GET: APIRoute = async ({ request }) => handleTutorialCron(request, 1, 2);

export const maxDuration = 300;
