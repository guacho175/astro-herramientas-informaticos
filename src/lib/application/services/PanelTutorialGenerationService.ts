import crypto from 'node:crypto';
import { DailyTutorialService, type DailyTutorialRun } from './DailyTutorialService';
import { vercelAIGeneratorService } from './VercelAIGeneratorService';
import { tutorialAdminRepository, type TutorialAdminRepository } from '../../infrastructure/repositories/TutorialAdminRepository';

const PANEL_LOCK_KEY = 'admin-emerging-panel';
const PANEL_LOCK_SECONDS = 360;

export class PanelGenerationBusyError extends Error {
  constructor() {
    super('Ya hay una generación automática del panel en curso.');
    this.name = 'PanelGenerationBusyError';
  }
}

function batchNamespace(): string {
  return `panel-emergente-${crypto.randomUUID()}`;
}

/**
 * Ejecuta lotes independientes desde el panel sin afectar los slots del cron.
 * El lock persiste en Supabase para que varias instancias no creen una cola.
 */
export class PanelTutorialGenerationService {
  constructor(private readonly store: TutorialAdminRepository = tutorialAdminRepository) {}

  async run(date = new Date()): Promise<DailyTutorialRun & { batchId: string }> {
    const lockToken = await this.store.claimGenerationLock(PANEL_LOCK_KEY, PANEL_LOCK_SECONDS);
    if (!lockToken) throw new PanelGenerationBusyError();

    const batchId = batchNamespace();
    try {
      const service = new DailyTutorialService(vercelAIGeneratorService, this.store);
      const run = await service.run(date, 2, batchId, 1);
      return { ...run, batchId };
    } finally {
      try {
        const released = await this.store.releaseGenerationLock(PANEL_LOCK_KEY, lockToken);
        if (!released) console.warn('[PanelTutorialGenerationService] No se pudo liberar el lock del panel.');
      } catch {
        console.error('[PanelTutorialGenerationService] Falló la liberación del lock del panel.');
      }
    }
  }
}

export const panelTutorialGenerationService = new PanelTutorialGenerationService();
