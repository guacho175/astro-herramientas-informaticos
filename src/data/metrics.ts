export interface Metric {
  value: string;
  label: string;
  detail: string;
}

export const metrics: Metric[] = [
  {
    value: '60+',
    label: 'Guías y tutoriales activos',
    detail: 'Contenido práctico para implementar soluciones tecnológicas sin perder tiempo.',
  },
  {
    value: '15',
    label: 'Colecciones temáticas',
    detail: 'Series sobre automatización, productividad, marketing técnico y más.',
  },
  {
    value: '8K+',
    label: 'Lectores mensuales',
    detail: 'Profesionales que descubren herramientas y tendencias para sus proyectos.',
  },
];
