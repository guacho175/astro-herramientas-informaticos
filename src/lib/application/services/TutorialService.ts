import { TutorialRepository } from '../../infrastructure/repositories/TutorialRepository';
import type { Tutorial } from '../../domain/models/Tutorial';

/**
 * Responsabilidad: Contener la lógica de negocio. Orquesta la comunicación
 * entre los componentes de Astro y el repositorio.
 */
export class TutorialService {
  private repository: TutorialRepository;

  constructor() {
    this.repository = new TutorialRepository();
  }

  async getTutorialCatalog(): Promise<Tutorial[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      // Aquí se podría integrar un logger externo (ej. Sentry)
      return [];
    }
  }

  async getPaginatedCatalog(page: number, pageSize: number): Promise<{ data: Tutorial[], count: number, totalPages: number }> {
    const { data, count } = await this.repository.getPaginated(page, pageSize);
    const totalPages = Math.ceil(count / pageSize);
    return { data, count, totalPages };
  }

  async getTutorialContent(slug: string): Promise<Tutorial | null> {
    try {
      const tutorial = await this.repository.getBySlug(slug);
      
      // Ejemplo de regla de negocio: Incrementar vistas al leer
      if (tutorial) {
        // Ejecutado en background de forma asíncrona ("fire and forget")
        this.repository.incrementViews(slug).catch(() => {});
      }
      
      return tutorial;
    } catch (error) {
      return null;
    }
  }

  async createTutorial(tutorialData: any): Promise<Tutorial> {
    return await this.repository.create(tutorialData);
  }

  // Ejemplo de lógica de negocio adicional
  getEstimatedReadingTime(content: string): number {
    const words = content.trim().split(/\s+/).length;
    const wordsPerMinute = 200;
    return Math.ceil(words / wordsPerMinute);
  }
}

// Instancia global para evitar crear el servicio múltiples veces por request
export const tutorialService = new TutorialService();
