export interface Metric {
  value: string;
  label: string;
  detail: string;
}

export const metrics: Metric[] = [
  {
    value: '12K+',
    label: 'Profesionales activos',
    detail: 'Consultores, docentes y equipos de IT que optimizan su operación.',
  },
  {
    value: '38%',
    label: 'Ahorro promedio de tiempo',
    detail: 'Comparado con la gestión manual de recursos y documentación.',
  },
  {
    value: '4.9/5',
    label: 'Valoración global',
    detail: 'Feedback consolidado de usuarios en Latinoamérica y España.',
  },
];
