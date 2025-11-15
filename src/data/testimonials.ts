export interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar?: string;
}

export const testimonials: Testimonial[] = [
  {
    name: 'Laura Méndez',
    role: 'Consultora DevOps',
    company: 'CloudBridge',
    quote:
      'Integramos las calculadoras y plantillas en nuestro onboarding y redujimos un 40% el tiempo de entrega de propuestas.',
  },
  {
    name: 'Diego Rivas',
    role: 'Director Académico',
    company: 'Bootcamp FullStack XYZ',
    quote:
      'La biblioteca de guías y la opción de marca blanca nos permitió lanzar un campus virtual con más de 600 estudiantes activos en dos semanas.',
  },
  {
    name: 'María Maturana',
    role: 'CTO',
    company: 'StartUp Latam',
    quote:
      'Las analíticas de uso nos ayudaron a detectar qué herramientas debíamos potenciar en nuestros planes premium y aumentar el ARPU.',
  },
];
