export interface Feature {
  title: string;
  description: string;
  icon: string;
  category: 'automatizacion' | 'aprendizaje' | 'monetizacion' | 'colaboracion';
}

export const featureHighlights: Feature[] = [
  {
    title: 'Panel unificado de herramientas',
    description:
      'Agrupa aplicaciones, workflows y accesos críticos en dashboards personalizables para cada proyecto o cliente.',
    icon: '🗂️',
    category: 'automatizacion',
  },
  {
    title: 'Calculadoras inteligentes',
    description:
      'Realiza estimaciones de horas, costos de infraestructura y márgenes de servicio en segundos.',
    icon: '🧮',
    category: 'monetizacion',
  },
  {
    title: 'Biblioteca de guías técnicas',
    description:
      'Accede a tutoriales paso a paso con casos reales para desplegar infraestructura, automatizar procesos y resolver incidencias.',
    icon: '📚',
    category: 'aprendizaje',
  },
  {
    title: 'Workflows colaborativos',
    description:
      'Comparte plantillas, solicita aprobaciones y documenta decisiones clave con trazabilidad completa.',
    icon: '🤝',
    category: 'colaboracion',
  },
];
