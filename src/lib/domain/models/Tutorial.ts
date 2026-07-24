export interface Tutorial {
  id?: string;
  slug: string;
  title: string;
  description: string;
  content_markdown: string;
  image?: string;
  category?: string;
  views?: number;
  is_premium?: boolean;
  updated_at?: string;
  created_at?: string;
}

// Podríamos agregar lógicas de negocio o validaciones aquí en un enfoque DDD puro, 
// pero usaremos anemic models por simplicidad inicial.
