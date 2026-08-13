export const TUTORIAL_CATEGORIES = [
  'Backend',
  'Frontend',
  'DevOps',
  'Desarrollo Web',
  'React',
  'Desarrollo de Software',
  'Control de Versiones',
  'Redes',
  'Ciberseguridad',
  'Sistemas Operativos',
  'Bases de Datos',
  'Programación',
  'Cloud',
  'Inteligencia Artificial',
] as const;

export type TutorialCategory = (typeof TUTORIAL_CATEGORIES)[number];

export interface TutorialResearchSource {
  title: string;
  url: string;
  excerpt?: string;
  publishedAt?: string;
}

export interface TutorialGenerationInput {
  topic: string;
  sources?: readonly TutorialResearchSource[];
}

export interface GeneratedTutorial {
  title: string;
  description: string;
  category: TutorialCategory;
  content_markdown: string;
}

export interface TutorialTokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedInputTokens?: number;
  reasoningTokens?: number;
}

export interface TutorialGenerationMetadata {
  requestedModel: string;
  resolvedModel: string;
  responseId: string;
  finishReason: string;
  generatedAt: string;
  usage: TutorialTokenUsage;
  providerMetadata?: unknown;
}

export interface TutorialGenerationResult extends GeneratedTutorial {
  metadata: TutorialGenerationMetadata;
}
