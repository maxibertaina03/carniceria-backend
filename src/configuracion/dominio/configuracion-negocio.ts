// Contexto de configuración: define cómo se comporta el sistema según el rubro
// del negocio (carnicería, fábrica de pastas, etc.). Es un contexto de soporte
// genérico; el resto de los módulos lo leen por un puerto, no directamente.

export type Rubro = 'carniceria' | 'pastas';

export interface CategoriaConfig {
  // Código que se guarda en la base (ej. "VACUNO", "PASTAS_RELLENAS").
  codigo: string;
  // Nombre para mostrar (ej. "Vacuno", "Pastas rellenas").
  nombre: string;
  // Si sus productos se fabrican con una receta (módulo Producción).
  producible: boolean;
  // Si es una categoría de insumos (ingredientes usables en recetas).
  esInsumo: boolean;
}

export interface FeaturesNegocio {
  // Stock por lote con fecha de vencimiento (pastas frescas).
  lotes: boolean;
  // Presentaciones de un mismo producto (½ kg, 1 kg, docena…).
  presentaciones: boolean;
}

export interface ConfiguracionNegocio {
  rubro: Rubro;
  nombreNegocio: string;
  // Códigos de las secciones visibles en la app (ver App.tsx del frontend).
  modulos: string[];
  categorias: CategoriaConfig[];
  features: FeaturesNegocio;
  // Textos que cambian por rubro (extensible; hoy casi todo sale de arriba).
  etiquetas: Record<string, string>;
}
