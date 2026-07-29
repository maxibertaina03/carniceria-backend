import { FeaturesNegocio } from '../../dominio/configuracion-negocio';

// Puerto que publica el contexto de configuración para que otros contextos
// (ej. Catálogo, Producción) lean lo que necesitan sin acoplarse al módulo.
export abstract class LectorConfiguracion {
  // Códigos de categoría válidos para el rubro activo.
  abstract categoriasValidas(): string[];
  // Categorías cuyos productos se fabrican con receta.
  abstract categoriasProducibles(): string[];
  // Interruptores de funciones por rubro (lotes, presentaciones…).
  abstract features(): FeaturesNegocio;
}
