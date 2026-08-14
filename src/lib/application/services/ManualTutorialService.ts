import type { Tutorial } from '../../domain/models/Tutorial';
import { tutorialAdminRepository, type TutorialAdminRepository } from '../../infrastructure/repositories/TutorialAdminRepository';
import { aiGeneratorService, type AIGeneratorService } from './AIGeneratorService';

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export class ManualTutorialService {
  constructor(
    private readonly generator: AIGeneratorService = aiGeneratorService,
    private readonly store: TutorialAdminRepository = tutorialAdminRepository,
  ) {}

  async generate(topic: unknown): Promise<Tutorial> {
    const normalizedTopic = typeof topic === 'string' ? topic.trim() : '';
    if (!normalizedTopic || normalizedTopic.length > 200) {
      throw new Error('El tema debe contener entre 1 y 200 caracteres.');
    }

    const generated = await this.generator.generateTutorial(normalizedTopic);
    const slug = createSlug(generated.title);
    if (!slug) throw new Error('El título generado no produjo un slug válido.');

    return this.store.create({
      slug,
      title: generated.title,
      description: generated.description,
      category: generated.category,
      content_markdown: generated.content_markdown,
      image: `/images/tutorials/${slug}.png`,
      views: 0,
    });
  }
}

export const manualTutorialService = new ManualTutorialService();
