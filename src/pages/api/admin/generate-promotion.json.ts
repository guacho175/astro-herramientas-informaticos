import type { APIRoute } from 'astro';
import { DailyTutorialService } from '../../../lib/application/services/DailyTutorialService';
import { vercelAIGeneratorService } from '../../../lib/application/services/VercelAIGeneratorService';
import { tutorialAdminRepository } from '../../../lib/infrastructure/repositories/TutorialAdminRepository';

const DEFAULT_PROMOTION_END = '2026-08-14T15:00:00.000Z';

function normalizeEnvValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

const cronSecret = normalizeEnvValue(
  import.meta.env.CRON_SECRET || process.env.CRON_SECRET,
);
const promotionBatchEnabled = normalizeEnvValue(
  import.meta.env.PROMOTION_BATCH_ENABLED || process.env.PROMOTION_BATCH_ENABLED,
);
const configuredPromotionEnd = normalizeEnvValue(
  import.meta.env.PROMOTION_END_AT || process.env.PROMOTION_END_AT,
);

function parseBody(value: unknown): { batchId: string; count: number } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const batchId = typeof body.batchId === 'string' ? body.batchId.trim().toLowerCase() : '';
  const count = body.count === undefined ? 2 : body.count;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(batchId) || batchId.length > 40) return null;
  if (!Number.isInteger(count) || Number(count) < 1 || Number(count) > 2) return null;
  return { batchId, count: Number(count) };
}

export const maxDuration = 300;

export const POST: APIRoute = async ({ request }) => {
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return json({ success: false, error: 'No autorizado.' }, 401);
  }

  if (promotionBatchEnabled !== 'true') {
    return json({ success: false, error: 'La ejecución promocional está deshabilitada.' }, 403);
  }

  const promotionEnd = configuredPromotionEnd || DEFAULT_PROMOTION_END;
  const promotionEndTime = Date.parse(promotionEnd);
  if (Number.isNaN(promotionEndTime)) {
    return json({ success: false, error: 'La ventana promocional no está configurada correctamente.' }, 500);
  }
  if (Date.now() >= promotionEndTime) {
    return json({ success: false, error: 'La ventana promocional terminó.' }, 410);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'El cuerpo debe ser JSON válido.' }, 400);
  }

  const input = parseBody(body);
  if (!input) {
    return json({ success: false, error: 'batchId debe ser único y count debe estar entre 1 y 2.' }, 400);
  }

  try {
    const service = new DailyTutorialService(vercelAIGeneratorService, tutorialAdminRepository);
    const run = await service.run(new Date(), input.count, `promocion-ling-${input.batchId}`);
    const status = run.failed === run.requested ? 500 : run.failed > 0 ? 207 : 200;
    return json({ success: run.failed === 0, batchId: input.batchId, ...run }, status);
  } catch {
    return json({ success: false, error: 'La ejecución promocional falló.' }, 500);
  }
};
