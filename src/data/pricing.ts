export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  billing: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel: string;
  ctaHref: string;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Starter',
    price: '$0',
    billing: 'Siempre gratis',
    description: 'Ideal para estudiantes y profesionales que recién comienzan a organizar sus herramientas digitales.',
    features: [
      'Acceso a 50+ herramientas gratuitas',
      'Calculadoras esenciales de presupuestos',
      'Newsletter semanal con tendencias del sector',
      '3 plantillas descargables en formato editable',
    ],
    ctaLabel: 'Crear cuenta gratuita',
    ctaHref: 'https://herramientasinformaticos.dev/signup',
  },
  {
    id: 'pro',
    name: 'Profesional',
    price: '$19',
    billing: 'Mensuales',
    description: 'Para freelancers y consultores que necesitan automatizar propuestas, presupuestos y seguimiento de clientes.',
    features: [
      'Biblioteca completa de herramientas y calculadoras',
      'Plantillas premium de propuestas y contratos',
      'Panel de analíticas de clientes y conversiones',
      'Soporte prioritario por correo y comunidad privada',
    ],
    highlighted: true,
    ctaLabel: 'Comenzar prueba de 7 días',
    ctaHref: 'https://herramientasinformaticos.dev/pro',
  },
  {
    id: 'scale',
    name: 'Escala',
    price: '$59',
    billing: 'Mensuales',
    description: 'Equipos y academias que buscan monetizar la plataforma con marca blanca y analíticas avanzadas.',
    features: [
      'Marca blanca y dominios personalizados',
      'Integración con CRM y herramientas externas',
      'Reportes automáticos y exportables para clientes',
      'Sesiones estratégicas mensuales 1:1',
    ],
    ctaLabel: 'Hablar con ventas',
    ctaHref: 'https://herramientasinformaticos.dev/enterprise',
  },
];
