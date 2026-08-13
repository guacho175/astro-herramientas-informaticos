import type { Tutorial } from '../../domain/models/Tutorial';
import type {
  GeneratedTutorial,
  TutorialGenerationInput,
  TutorialGenerationResult,
  TutorialResearchSource,
} from '../../domain/models/TutorialGeneration';
import { TUTORIAL_CATEGORIES } from '../../domain/models/TutorialGeneration';
import { emergingTopics, type EmergingTopic } from '../../../data/emergingTopics';
import {
  technologyFeedService,
  type EmergingTopicCandidate,
} from './TechnologyFeedService';

export interface DailyTutorialGenerator {
  generateTutorial(input: TutorialGenerationInput | string): Promise<TutorialGenerationResult>;
}

export interface DailyTutorialStore {
  list(): Promise<Pick<Tutorial, 'slug' | 'title' | 'description'>[]>;
  findBySlug(slug: string): Promise<Tutorial | null>;
  findBySlugPrefix(prefix: string): Promise<Tutorial | null>;
  claimJob(jobKey: string): Promise<string | null>;
  createAndCompleteJob(jobKey: string, claimToken: string, tutorial: Tutorial): Promise<Tutorial>;
  failJob(jobKey: string, claimToken: string, errorCode: string): Promise<boolean>;
}

export type DailyTutorialResult =
  | { slot: number; status: 'created'; slug: string; title: string; topicId: string }
  | { slot: number; status: 'skipped'; slug: string; reason: 'already-generated'; topicId: string }
  | { slot: number; status: 'failed'; slug: string; error: string; topicId: string };

export interface DailyTutorialRun {
  date: string;
  requested: number;
  created: number;
  skipped: number;
  failed: number;
  results: DailyTutorialResult[];
}

export interface EmergingTopicDiscoverer {
  discover(limit?: number): Promise<EmergingTopicCandidate[]>;
}

interface DailyTopic {
  id: string;
  title: string;
  brief: string;
  category: string;
  sources: TutorialResearchSource[];
  dedupeTerms: string[];
}

const DAY_IN_MS = 86_400_000;

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function utcDateKey(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new Error('La fecha de ejecución no es válida.');
  return date.toISOString().slice(0, 10);
}

function idempotencyPrefix(namespace: string, dateKey: string, slot: number): string {
  const stableNamespace = namespace.startsWith('promocion-ling-')
    ? namespace
    : `${namespace}-${dateKey}`;
  return `${stableNamespace}-${String(slot).padStart(2, '0')}-`;
}

function titleSlug(title: string): string {
  return normalize(title).replace(/\s+/g, '-').slice(0, 80).replace(/-+$/g, '') || 'guia';
}

function isCovered(topic: DailyTopic, tutorials: Pick<Tutorial, 'slug' | 'title' | 'description'>[]): boolean {
  const catalogEntries = tutorials.map((tutorial) => normalize(`${tutorial.title} ${tutorial.description}`));

  return topic.dedupeTerms.some((term) => {
    const normalizedTerm = normalize(term);
    if (catalogEntries.some((entry) => entry.includes(normalizedTerm))) return true;

    const tokens = [...new Set(normalizedTerm.split(' ').filter((token) => token.length >= 4))];
    if (tokens.length < 3) return false;

    return catalogEntries.some((entry) => {
      const matches = tokens.filter((token) => entry.includes(token)).length;
      return matches / tokens.length >= 0.6;
    });
  });
}

function curatedTopic(topic: EmergingTopic): DailyTopic {
  return {
    ...topic,
    sources: topic.sources.map((url) => ({ title: new URL(url).hostname, url })),
    dedupeTerms: [...topic.dedupeTerms],
  };
}

function discoveredTopic(candidate: EmergingTopicCandidate): DailyTopic {
  const normalizedTitle = normalize(candidate.topic);
  return {
    id: `feed-${normalizedTitle.replace(/\s+/g, '-').slice(0, 60)}`,
    title: candidate.topic,
    brief: 'Explica esta novedad reciente a partir del anuncio oficial, con un caso de uso práctico, requisitos, verificación y limitaciones.',
    category: 'Desarrollo de Software',
    sources: candidate.sources,
    dedupeTerms: [candidate.topic],
  };
}

function selectTopics(
  date: Date,
  tutorials: Pick<Tutorial, 'slug' | 'title' | 'description'>[],
  count: number,
  discovered: EmergingTopicCandidate[],
): DailyTopic[] {
  const start = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_IN_MS)
    % emergingTopics.length;
  const curated = emergingTopics.map((_, offset) => curatedTopic(emergingTopics[(start + offset) % emergingTopics.length]));
  const feedTopics = discovered.map(discoveredTopic);
  const ordered = [...feedTopics, ...curated].filter(
    (topic, index, all) => all.findIndex((candidate) => candidate.id === topic.id) === index,
  );
  const uncovered = ordered.filter((topic) => !isCovered(topic, tutorials));
  const selected = uncovered.slice(0, count);

  // Cuando todo el ciclo ya fue cubierto, se vuelve a rotar para producir una
  // edición actualizada en vez de detener indefinidamente el cron.
  for (const topic of ordered) {
    if (selected.length >= count) break;
    if (!selected.some((candidate) => candidate.id === topic.id)) selected.push(topic);
  }

  return selected;
}

function assertGeneratedTutorial(value: GeneratedTutorial): void {
  if (!value || typeof value !== 'object') throw new Error('El modelo no devolvió un tutorial estructurado.');

  for (const field of ['title', 'description', 'content_markdown'] as const) {
    if (typeof value[field] !== 'string' || value[field].trim().length === 0) {
      throw new Error(`El modelo devolvió el campo ${field} vacío.`);
    }
  }
}

function safeError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'GenerationError';

  const record = error as Record<string, unknown>;
  const nested = [record.lastError, record.cause]
    .find((candidate): candidate is Record<string, unknown> => Boolean(candidate && typeof candidate === 'object'));
  const name = error instanceof Error && error.name ? error.name : 'GenerationError';
  const nestedName = typeof nested?.name === 'string' ? nested.name : '';
  const status = [record.statusCode, nested?.statusCode]
    .find((candidate) => typeof candidate === 'number');
  const parts = [name, nestedName, status ? `HTTP${status}` : ''].filter(Boolean);

  if (parts.length > 0) return parts.join('-').slice(0, 100);
  return 'GenerationError';
}

export class DailyTutorialService {
  constructor(
    private readonly generator: DailyTutorialGenerator,
    private readonly store: DailyTutorialStore,
    private readonly discoverer: EmergingTopicDiscoverer = technologyFeedService,
  ) {}

  async run(
    date = new Date(),
    count = 2,
    namespace = 'tutorial-emergente',
    startingSlot = 1,
  ): Promise<DailyTutorialRun> {
    if (!Number.isInteger(count) || count < 1 || count > emergingTopics.length) {
      throw new Error('La cantidad solicitada de tutoriales no es válida.');
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(namespace) || namespace.length > 80) {
      throw new Error('El identificador de ejecución no es válido.');
    }
    if (!Number.isInteger(startingSlot) || startingSlot < 1 || startingSlot + count - 1 > emergingTopics.length) {
      throw new Error('La posición inicial de generación no es válida.');
    }

    const dateKey = utcDateKey(date);
    const catalog = await this.store.list();
    const runPrefix = idempotencyPrefix(namespace, dateKey, 1).replace(/01-$/, '');
    const previousCatalog = catalog.filter((tutorial) => !tutorial.slug.startsWith(runPrefix));
    const topicWindow = startingSlot + count - 1;
    const discovered = await this.discoverer.discover(Math.max(topicWindow * 4, 8));
    const topics = selectTopics(date, previousCatalog, topicWindow, discovered);
    const results: DailyTutorialResult[] = [];

    // Secuencial a propósito: reduce ráfagas y respeta mejor los límites del proveedor.
    for (let index = 0; index < count; index += 1) {
      const slot = startingSlot + index;
      const topic = topics[startingSlot + index - 1];
      const slugPrefix = idempotencyPrefix(namespace, dateKey, slot);
      const jobKey = slugPrefix.replace(/-$/, '');
      let claimToken: string | null = null;

      try {
        const existing = await this.store.findBySlugPrefix(slugPrefix);
        if (existing) {
          results.push({ slot, status: 'skipped', slug: existing.slug, reason: 'already-generated', topicId: topic.id });
          continue;
        }

        claimToken = await this.store.claimJob(jobKey);
        if (!claimToken) {
          results.push({ slot, status: 'skipped', slug: slugPrefix, reason: 'already-generated', topicId: topic.id });
          continue;
        }

        const generationTopic = `${topic.title}. ${topic.brief}`.slice(0, 240).trim();
        const generation = await this.generator.generateTutorial({
          topic: generationTopic,
          suggestedTitle: topic.title,
          category: (TUTORIAL_CATEGORIES as readonly string[]).includes(topic.category)
            ? topic.category as TutorialGenerationInput['category']
            : 'Desarrollo de Software',
          sources: topic.sources,
        });
        const generated = generation;
        assertGeneratedTutorial(generated);
        const slug = `${slugPrefix}${titleSlug(generated.title)}`;

        const created = await this.store.createAndCompleteJob(jobKey, claimToken, {
          slug,
          title: generated.title.trim(),
          description: generated.description.trim(),
          category: generated.category?.trim() || topic.category,
          content_markdown: generated.content_markdown.trim(),
          views: 0,
          is_premium: false,
        });

        console.info(
          `[DailyTutorialService] Slot ${slot} creado con ${generation.metadata.resolvedModel}; ` +
          `tokens: ${generation.metadata.usage.totalTokens ?? 'desconocido'}.`,
        );
        results.push({ slot, status: 'created', slug: created.slug, title: created.title, topicId: topic.id });
      } catch (error) {
        const errorCode = safeError(error);
        if (claimToken) {
          try {
            const failed = await this.store.failJob(jobKey, claimToken, errorCode);
            if (!failed) console.warn(`[DailyTutorialService] El slot ${slot} perdió la propiedad del job.`);
          } catch {
            console.error(`[DailyTutorialService] No se pudo registrar el fallo del slot ${slot}.`);
          }
        }
        console.error(`[DailyTutorialService] Falló el slot ${slot} (${topic.id}); código: ${errorCode}.`);
        results.push({ slot, status: 'failed', slug: slugPrefix, error: errorCode, topicId: topic.id });
      }
    }

    return {
      date: dateKey,
      requested: count,
      created: results.filter((result) => result.status === 'created').length,
      skipped: results.filter((result) => result.status === 'skipped').length,
      failed: results.filter((result) => result.status === 'failed').length,
      results,
    };
  }
}
