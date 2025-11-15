export interface FAQItem {
  question: string;
  answer: string;
}

export const faqs: FAQItem[] = [
  {
    question: '¿Cómo integro Google AdSense en mi blog?',
    answer:
      'Configura tu cuenta de AdSense, crea bloques de anuncio y reemplaza los IDs de ejemplo en siteConfig.adsense. El componente AdSlot se encargará de mostrarlos de forma responsive.',
  },
  {
    question: '¿Cada cuánto publican nuevos tutoriales?',
    answer:
      'Publicamos al menos una guía extensa y dos cápsulas breves por semana, priorizando temas sugeridos por la comunidad.',
  },
  {
    question: '¿Puedo proponer una herramienta o recurso?',
    answer:
      'Sí. Escríbenos mediante el formulario de contacto con el caso de uso y añadiremos tu sugerencia a la agenda editorial.',
  },
  {
    question: '¿Ofrecen colaboraciones patrocinadas?',
    answer:
      'Aceptamos reseñas y campañas siempre que aporten valor educativo. Contáctanos para revisar formatos y disponibilidad.',
  },
];
