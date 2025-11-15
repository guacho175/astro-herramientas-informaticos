export interface Feature {
  title: string;
  description: string;
  icon: string;
  category: 'contenido' | 'herramientas' | 'tendencias' | 'comunidad';
}

export const featureHighlights: Feature[] = [
  {
    title: 'Tutoriales accionables',
    description:
      'Cada guía incluye pasos claros, snippets de código y recursos descargables para que ejecutes sin adivinar.',
    icon: '🛠️',
    category: 'contenido',
  },
  {
    title: 'Selección semanal de herramientas',
    description:
      'Probamos apps, extensiones y flujos de trabajo para recomendar solo lo que aporta valor real a tus proyectos.',
    icon: '🧭',
    category: 'herramientas',
  },
  {
    title: 'Cobertura de tendencias',
    description:
      'Detectamos oportunidades virales, lanzamientos y cambios de plataformas para que llegues primero.',
    icon: '🌐',
    category: 'tendencias',
  },
  {
    title: 'Guías para monetizar con anuncios',
    description:
      'Buenas prácticas para colocar publicidad, medirla con analíticas y mantener una experiencia positiva.',
    icon: '💡',
    category: 'comunidad',
  },
];
