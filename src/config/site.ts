export const siteConfig = {
  site: 'https://herramientasinformaticos.dev',
  name: 'Herramientas para Informáticos',
  title: 'Herramientas para Informáticos',
  description:
    'Suite integral de recursos digitales para estudiantes, desarrolladores y profesionales de TI que buscan optimizar su trabajo diario.',
  keywords: [
    'herramientas informáticos',
    'productividad para desarrolladores',
    'recursos para estudiantes de informática',
    'software recomendado',
    'calculadoras tecnológicas',
  ],
  tagline: 'Automatiza, aprende y escala tus proyectos tecnológicos desde un mismo lugar.',
  hero: {
    eyebrow: 'Plataforma todo-en-uno para profesionales de TI',
    title: 'Centraliza tus herramientas digitales y crea nuevos ingresos con productos premium.',
    subtitle:
      'Accede a guías accionables, plantillas listas para usar, calculadoras inteligentes y analíticas para monetizar tus servicios.',
    primaryAction: { label: 'Probar gratis por 7 días', href: '#planes' },
    secondaryAction: { label: 'Ver demo interactiva', href: '#demo' },
  },
  navigation: [
    { label: 'Inicio', href: '/' },
    { label: 'Recursos', href: '/blog/apps' },
    { label: 'Guías', href: '/blog/guias' },
    { label: 'Calculadoras', href: '/blog/calculadoras' },
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
  monetization: {
    premiumProduct: 'Herramientas para Informáticos PRO',
    promise:
      'Multiplica tu productividad con librerías privadas, automatizaciones exclusivas y soporte experto.',
    premiumFeatures: [
      'Acceso ilimitado a todas las herramientas y calculadoras avanzadas',
      'Biblioteca de plantillas editables para consultoría y freelancing',
      'Panel de métricas con analíticas en tiempo real de uso y conversión',
      'Capacitaciones mensuales en vivo y comunidad privada',
      'Marca blanca para revender la suite a tus propios clientes',
    ],
    freePlanBenefits: [
      'Catálogo curado de herramientas gratuitas',
      'Boletín semanal con novedades del sector',
      'Calculadoras esenciales para presupuestos y estimaciones rápidas',
    ],
  },
  seo: {
    twitter: '@herramientasit',
    openGraphImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
};

export type SiteConfig = typeof siteConfig;
