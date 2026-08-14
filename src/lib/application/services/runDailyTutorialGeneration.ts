import { DailyTutorialService, type DailyTutorialRun } from './DailyTutorialService';
import { vercelAIGeneratorService } from './VercelAIGeneratorService';
import { tutorialAdminRepository } from '../../infrastructure/repositories/TutorialAdminRepository';

export interface DailyTutorialGenerationOptions {
  date?: Date;
  count?: number;
  startingSlot?: number;
}

/** Entrada única para el cron y el panel; ambos comparten slots e idempotencia UTC. */
export async function runDailyTutorialGeneration(
  { date = new Date(), count = 2, startingSlot = 1 }: DailyTutorialGenerationOptions = {},
): Promise<DailyTutorialRun> {
  const service = new DailyTutorialService(vercelAIGeneratorService, tutorialAdminRepository);
  return service.run(date, count, 'tutorial-emergente', startingSlot);
}
