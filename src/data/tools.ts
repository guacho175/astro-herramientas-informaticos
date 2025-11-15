export interface Tool {
  title: string;
  description: string;
  link: string;
  emoji: string;
  category: 'productividad' | 'desarrollo' | 'diseno' | 'analitica' | 'automatizacion' | 'aprendizaje';
  categoryLabel: string;
  tags: string[];
  premium?: boolean;
}

export const tools: Tool[] = [
  {
    title: 'Notion',
    description:
      'Organiza apuntes, entregables y documentación técnica con bases de datos colaborativas.',
    link: 'https://www.notion.so/',
    emoji: '📂️',
    category: 'productividad',
    categoryLabel: 'Productividad',
    tags: ['gestión', 'documentación', 'equipo'],
  },
  {
    title: 'Linear',
    description: 'Gestiona incidencias y roadmaps con workflows veloces para equipos de ingeniería.',
    link: 'https://linear.app/',
    emoji: '🛣️',
    category: 'productividad',
    categoryLabel: 'Productividad',
    tags: ['roadmap', 'tickets', 'agile'],
    premium: true,
  },
  {
    title: 'Visual Studio Code',
    description: 'Editor de código ligero con extensiones para automatizar testing, linting y despliegues.',
    link: 'https://code.visualstudio.com/',
    emoji: '💻',
    category: 'desarrollo',
    categoryLabel: 'Desarrollo',
    tags: ['editor', 'typescript', 'debug'],
  },
  {
    title: 'Postman',
    description: 'Suite para documentar APIs, generar test automatizados y monitorear integraciones.',
    link: 'https://www.postman.com/',
    emoji: '📮',
    category: 'desarrollo',
    categoryLabel: 'Desarrollo',
    tags: ['api', 'testing', 'automatización'],
  },
  {
    title: 'Figma',
    description: 'Diseña interfaces y prototipos interactivos listos para desarrolladores.',
    link: 'https://www.figma.com/',
    emoji: '🎨',
    category: 'diseno',
    categoryLabel: 'Diseño',
    tags: ['ux', 'ui', 'prototipos'],
  },
  {
    title: 'Looker Studio',
    description: 'Crea dashboards de rendimiento y seguimiento de campañas con datos en tiempo real.',
    link: 'https://lookerstudio.google.com/',
    emoji: '📊',
    category: 'analitica',
    categoryLabel: 'Analítica',
    tags: ['dashboards', 'metricas', 'seo'],
    premium: true,
  },
  {
    title: 'Zapier',
    description: 'Automatiza tareas entre herramientas sin escribir código y centraliza notificaciones clave.',
    link: 'https://zapier.com/',
    emoji: '⚙️',
    category: 'automatizacion',
    categoryLabel: 'Automatización',
    tags: ['workflow', 'integraciones', 'nocode'],
    premium: true,
  },
  {
    title: 'Stack Overflow',
    description: 'Resuelve dudas técnicas con respuestas de la comunidad global de desarrolladores.',
    link: 'https://stackoverflow.com/',
    emoji: '🧠',
    category: 'aprendizaje',
    categoryLabel: 'Aprendizaje',
    tags: ['comunidad', 'soporte', 'preguntas'],
  },
  {
    title: 'ChatGPT',
    description: 'Acelera la documentación y generación de código con inteligencia artificial conversacional.',
    link: 'https://chat.openai.com/',
    emoji: '🤖',
    category: 'automatizacion',
    categoryLabel: 'Automatización',
    tags: ['ia', 'productividad', 'documentación'],
    premium: true,
  },
];
