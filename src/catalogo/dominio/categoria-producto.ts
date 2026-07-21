export type CategoriaProducto =
  | 'VACUNO'
  | 'CERDO'
  | 'AVE'
  | 'CHACINADOS'
  | 'MILANESAS'
  | 'HAMBURGUESAS'
  | 'INSUMOS'
  | 'OTROS';

export const CATEGORIAS_PRODUCTO: CategoriaProducto[] = [
  'VACUNO',
  'CERDO',
  'AVE',
  'CHACINADOS',
  'MILANESAS',
  'HAMBURGUESAS',
  'INSUMOS',
  'OTROS',
];

// Categorías cuyos productos se fabrican con una receta (contexto Producción).
export const CATEGORIAS_PRODUCIBLES: CategoriaProducto[] = [
  'CHACINADOS',
  'MILANESAS',
  'HAMBURGUESAS',
];
