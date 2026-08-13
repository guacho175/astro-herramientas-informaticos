import 'dotenv/config';

export interface GeneratedTutorial {
  title: string;
  description: string;
  category: string;
  content_markdown: string;
}

class GeminiGenerationError extends Error {
  constructor(message: string, readonly recoverable: boolean) {
    super(message);
    this.name = 'GeminiGenerationError';
  }
}

const REQUEST_TIMEOUT_MS = 45_000;
const MIN_CONTENT_WORDS = 1_200;

export class AIGeneratorService {
  private readonly apiKey: string;

  // La cascada conserva los modelos configurados para el panel manual.
  // Los errores transitorios o propios de una respuesta permiten probar el siguiente.
  private readonly models = [
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash'
  ];

  constructor() {
    this.apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  }

  /**
   * Genera un tutorial usando Gemini y aplica fallback solo cuando otro modelo
   * puede resolver razonablemente el fallo (cuota, indisponibilidad o salida inválida).
   */
  async generateTutorial(topic: string, retries = 0): Promise<GeneratedTutorial> {
    if (!this.apiKey) {
      throw new Error('El proveedor de IA no está configurado.');
    }

    const normalizedTopic = typeof topic === 'string' ? topic.trim() : '';
    if (!normalizedTopic || normalizedTopic.length > 200) {
      throw new Error('El tema debe contener entre 1 y 200 caracteres.');
    }

    const startIndex = Number.isInteger(retries) && retries >= 0 ? retries : 0;
    if (startIndex >= this.models.length) {
      throw new Error('No hay modelos disponibles para generar el tutorial.');
    }

    const prompt = this.buildPrompt(normalizedTopic);

    for (let modelIndex = startIndex; modelIndex < this.models.length; modelIndex += 1) {
      const currentModel = this.models[modelIndex];

      try {
        return await this.generateWithModel(currentModel, prompt);
      } catch (error) {
        const generationError = this.toGenerationError(error);

        if (!generationError.recoverable) {
          throw generationError;
        }

        console.warn(
          `[Gemini] El modelo ${currentModel} no completó la generación; se intentará el siguiente modelo.`
        );
      }
    }

    throw new Error('No fue posible generar un tutorial válido con los modelos disponibles.');
  }

  private async generateWithModel(model: string, prompt: string): Promise<GeneratedTutorial> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                required: ['title', 'description', 'category', 'content_markdown'],
                properties: {
                  title: { type: 'STRING' },
                  description: { type: 'STRING' },
                  category: { type: 'STRING' },
                  content_markdown: { type: 'STRING' }
                }
              }
            }
          })
        }
      );

      if (!response.ok) {
        throw new GeminiGenerationError(
          `El proveedor de IA rechazó la solicitud (HTTP ${response.status}).`,
          this.isRecoverableStatus(response.status)
        );
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new GeminiGenerationError('El proveedor devolvió una respuesta inválida.', true);
      }

      const content = this.extractText(data);
      if (!content) {
        throw new GeminiGenerationError('El proveedor devolvió una respuesta vacía.', true);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new GeminiGenerationError('El proveedor devolvió JSON inválido.', true);
      }

      try {
        return this.validateTutorial(parsed);
      } catch {
        throw new GeminiGenerationError('El tutorial generado no cumple el formato requerido.', true);
      }
    } catch (error) {
      if (error instanceof GeminiGenerationError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new GeminiGenerationError('La solicitud al proveedor excedió el tiempo máximo.', true);
      }

      if (error instanceof TypeError) {
        throw new GeminiGenerationError('No fue posible contactar al proveedor de IA.', true);
      }

      throw new GeminiGenerationError('Falló la generación del tutorial.', false);
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildPrompt(topic: string): string {
    return `
Eres un Arquitecto de Software Experto y Technical Writer.
Escribe un tutorial técnico ultra-detallado sobre el tema: "${topic}".
El tutorial debe ser en español latinoamericano, tener al menos 1200 palabras, incluir ejemplos de código reales y prácticos,
y usar alertas/notas en Markdown.
El tono debe ser técnico pero fácil de entender.

REGLA CRÍTICA:
Todo artículo generado debe cumplir estrictamente con el esquema de contenido. Devuelve únicamente JSON válido, sin bloques Markdown alrededor:
{
  "title": "Un título SEO atractivo (máximo 60 caracteres)",
  "description": "Una meta descripción técnica obligatoria (máximo 150 caracteres)",
  "category": "Categoría (por ejemplo: Backend, Frontend, DevOps o Desarrollo Web)",
  "content_markdown": "El contenido completo del artículo en Markdown, con subtítulos y al menos un bloque de código"
}`;
  }

  private extractText(data: unknown): string | null {
    if (!this.isRecord(data) || !Array.isArray(data.candidates)) {
      return null;
    }

    const candidate = data.candidates[0];
    if (!this.isRecord(candidate) || !this.isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
      return null;
    }

    const text = candidate.content.parts
      .filter((part): part is Record<string, unknown> => this.isRecord(part))
      .map((part) => part.text)
      .filter((partText): partText is string => typeof partText === 'string')
      .join('')
      .trim();

    return text || null;
  }

  private validateTutorial(value: unknown): GeneratedTutorial {
    if (!this.isRecord(value)) {
      throw new Error('Formato inválido.');
    }

    const title = this.requiredString(value.title);
    const description = this.requiredString(value.description);
    const category = this.requiredString(value.category);
    const contentMarkdown = this.requiredString(value.content_markdown);

    const wordCount = contentMarkdown.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
    const hasHeading = /^#{2,6}\s+\S/m.test(contentMarkdown);
    const hasCodeBlock = /```[^\n]*\n[\s\S]+?```/.test(contentMarkdown);

    if (
      title.length > 60 ||
      description.length > 150 ||
      category.length > 60 ||
      wordCount < MIN_CONTENT_WORDS ||
      !hasHeading ||
      !hasCodeBlock
    ) {
      throw new Error('Contenido inválido.');
    }

    return {
      title,
      description,
      category,
      content_markdown: contentMarkdown
    };
  }

  private requiredString(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error('Campo obligatorio inválido.');
    }

    return value.trim();
  }

  private isRecoverableStatus(status: number): boolean {
    return status === 404 || status === 408 || status === 425 || status === 429 || status >= 500;
  }

  private toGenerationError(error: unknown): GeminiGenerationError {
    if (error instanceof GeminiGenerationError) {
      return error;
    }

    return new GeminiGenerationError('Falló la generación del tutorial.', false);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

export const aiGeneratorService = new AIGeneratorService();
