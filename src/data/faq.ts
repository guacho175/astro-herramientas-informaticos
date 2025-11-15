export interface FAQItem {
  question: string;
  answer: string;
}

export const faqs: FAQItem[] = [
  {
    question: '¿Puedo usar la plataforma sin conocimientos avanzados de programación?',
    answer:
      'Sí. Diseñamos cada flujo con instrucciones guiadas y plantillas editables. Además, en el plan PRO tienes soporte prioritario para acompañarte en la implementación.',
  },
  {
    question: '¿Cómo funcionan las analíticas incluidas?',
    answer:
      'Recopilamos eventos de uso anonimizados (clicks, descargas, conversiones) para mostrarte qué recursos generan más valor y en qué etapa pierdes usuarios.',
  },
  {
    question: '¿Ofrecen precios especiales para instituciones educativas?',
    answer:
      'Sí. El plan Escala incluye licencias multiusuario, marca blanca y workshops mensuales para docentes. Escríbenos para una propuesta personalizada.',
  },
  {
    question: '¿Puedo revender la plataforma con mi marca?',
    answer:
      'Con el plan Escala obtienes acceso a marca blanca, dominios personalizados y automatizaciones para cobrar desde tu propio sitio.',
  },
];
