export class AIGeneratorService {
  private apiKey: string;
  // Cascada de modelos. Empieza por el más rápido/económico, si falla salta al siguiente.
  private models = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3-flash-preview',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash'
  ];

  constructor() {
    this.apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  }

  /**
   * Genera el tutorial usando la cascada de modelos.
   */
  async generateTutorial(topic: string, retries = 0): Promise<any> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada.');
    }

    if (retries >= this.models.length) {
      throw new Error('Todos los modelos fallaron o la cuota se ha agotado en todos.');
    }

    const currentModel = this.models[retries];
    console.log(`Intentando generar con el modelo: ${currentModel} (Intento ${retries + 1})`);

    const prompt = `
Eres un Arquitecto de Software Experto y Technical Writer.
Escribe un tutorial técnico ultra-detallado sobre el tema: "${topic}".
El tutorial debe ser en español latinoamericano, tener más de 1200 palabras, incluir ejemplos de código reales y prácticos,
y usar alertas/notas en markdown.
El tono debe ser técnico pero fácil de entender.

Responde ÚNICAMENTE en formato JSON válido con la siguiente estructura, sin bloques de código markdown alrededor:
{
  "title": "Un título SEO atractivo (max 60 caracteres)",
  "description": "Una meta descripción técnica (max 150 caracteres)",
  "category": "Categoría (ej. Backend, Frontend, DevOps)",
  "content_markdown": "El contenido completo del artículo en Markdown."
}
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`[429 Quota Exceeded] Falló el modelo ${currentModel}. Saltando al siguiente...`);
        } else {
          console.warn(`[Error ${response.status}] Falló el modelo ${currentModel}. Saltando al siguiente...`);
        }
        return this.generateTutorial(topic, retries + 1); // Trigger Fallback
      }

      const data = await response.json();
      
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) throw new Error('Respuesta vacía del modelo.');

      const parsedJSON = JSON.parse(content);
      return parsedJSON;

    } catch (error) {
      console.error(`Error de red o parseo en modelo ${currentModel}:`, error);
      // Fallback al siguiente modelo
      return this.generateTutorial(topic, retries + 1);
    }
  }
}

export const aiGeneratorService = new AIGeneratorService();
