export const siteConfig = {
  site: 'https://herramientasinformaticos.dev',
  name: 'Herramientas para Informáticos',
  title: 'Herramientas para Informáticos',
  description:
    'Blog especializado en guías, tutoriales y tendencias tecnológicas para estudiantes, desarrolladores y consultores TI.',
  keywords: [
    'blog de informática',
    'tutoriales de tecnología',
    'novedades digitales',
    'herramientas para desarrolladores',
    'guías para consultores TI',
  ],
  tagline: 'Descubre recursos confiables para aprender, experimentar y monetizar con anuncios.',
  hero: {
    eyebrow: 'Guías y novedades para profesionales TI',
    title: 'Explora tutoriales listos para implementar y descubre lo último en herramientas digitales',
    subtitle:
      'Actualizamos cada semana con flujos paso a paso, reseñas y tendencias de Internet para que crees proyectos memorables y escales con publicidad.',
    primaryAction: { label: 'Ver últimas guías', href: '/blog/guias' },
    secondaryAction: { label: 'Explorar herramientas', href: '/blog/apps' },
  },
  navigation: [
    { label: 'Inicio', href: '/' },
    { label: 'Guías', href: '/blog/guias' },
    { label: 'Herramientas', href: '/blog/apps' },
    { label: 'Laboratorio', href: '/blog/calculadoras' },
    { label: 'Contacto', href: '/contacto' },
  ],
  analytics: {
    provider: 'plausible',
    domain: 'herramientasinformaticos.dev',
  },
  social: [
    { label: 'YouTube', href: 'https://youtube.com/@herramientasinformaticos' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/herramientas-informaticos' },
    { label: 'Newsletter', href: 'https://herramientasinformaticos.dev/newsletter' },
  ],
  contactEmail: 'hola@herramientasinformaticos.dev',
  editorial: {
    intro:
      'Series especializadas para profundizar en automatización, contenido educativo y hallazgos semanales de la web.',
    pillars: [
      {
        title: 'Guías paso a paso',
        description: 'Implementaciones reales de infraestructura, automatización y buenas prácticas listas para ejecutar.',
        href: '/blog/guias',
      },
      {
        title: 'Radar de herramientas',
        description: 'Nuevas apps, extensiones y workflows para impulsar tu productividad y la de tus clientes.',
        href: '/blog/apps',
      },
      {
        title: 'Laboratorio creativo',
        description: 'Ideas experimentales, recursos descargables y tendencias emergentes de Internet.',
        href: '/blog/calculadoras',
      },
    ],
    highlight: {
      label: 'Reporte destacado',
      title: 'Cómo optimizar ingresos con anuncios sin descuidar la experiencia',
      description:
        'Checklist práctico para configurar Google AdSense, analizar rendimiento y planificar colocación responsable de anuncios.',
      href: '/blog/guias',
      linkLabel: 'Leer el reporte',
    },
  },
  adsense: {
    client: 'ca-pub-0000000000000000',
    slots: {
      hero: '0000000001',
      inFeed: '0000000002',
      sidebar: '0000000003',
    },
  },
  seo: {
    twitter: '@herramientasit',
    openGraphImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
};

export type SiteConfig = typeof siteConfig;
