// Modelos de lectura de recetas y órdenes de producción (con nombres para la UI).

export interface IngredienteRecetaDetalle {
  productoId: string;
  productoNombre: string;
  unidadMedida: string;
  cantidad: number;
}

export interface RecetaDetalle {
  id: string;
  productoTerminadoId: string;
  productoTerminadoNombre: string;
  rindeCantidad: number;
  activa: boolean;
  ingredientes: IngredienteRecetaDetalle[];
}

export interface ItemProduccionDetalle {
  productoId: string;
  productoNombre: string;
  // Unidad del ingrediente (ej. GRAMO para la sal) para mostrar bien la cantidad.
  unidadMedida: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

export interface OrdenProduccionDetalle {
  id: string;
  fecha: Date;
  productoTerminadoId: string;
  productoTerminadoNombre: string;
  // Unidad del producto terminado (KG para embutidos, UNIDAD para hamburguesas).
  productoTerminadoUnidad: string;
  cantidadProducida: number;
  costoTotal: number;
  costoUnitario: number;
  observaciones: string | null;
  items: ItemProduccionDetalle[];
}

export abstract class ConsultasProduccion {
  abstract listarRecetas(): Promise<RecetaDetalle[]>;
  abstract obtenerRecetaPorProducto(
    productoTerminadoId: string,
  ): Promise<RecetaDetalle | null>;
  abstract listarOrdenes(): Promise<OrdenProduccionDetalle[]>;
  abstract obtenerOrden(id: string): Promise<OrdenProduccionDetalle | null>;
}
