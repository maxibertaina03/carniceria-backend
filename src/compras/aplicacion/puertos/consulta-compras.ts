// Modelo de lectura de compras (incluye el nombre del producto para la UI).
export interface ItemCompraDetalle {
  id: string;
  productoId: string;
  productoNombre: string;
  // Unidad del producto (KG, GRAMO, METRO, UNIDAD) para mostrar bien la cantidad.
  unidadMedida: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

export interface CompraDetalle {
  id: string;
  fecha: Date;
  proveedor: string | null;
  total: number;
  observaciones: string | null;
  items: ItemCompraDetalle[];
}

export abstract class ConsultaCompras {
  abstract obtenerTodas(): Promise<CompraDetalle[]>;
  abstract obtenerPorId(id: string): Promise<CompraDetalle | null>;
}
