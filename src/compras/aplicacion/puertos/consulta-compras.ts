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
  proveedorId: string | null;
  proveedorNombre: string | null;
  total: number;
  montoAdeudado: number;
  montoPagado: number;
  // Derivada: CONTADO (0 adeudado), ADEUDADO (todo) o MIXTO.
  formaPago: string;
  observaciones: string | null;
  items: ItemCompraDetalle[];
}

export abstract class ConsultaCompras {
  abstract obtenerTodas(): Promise<CompraDetalle[]>;
  abstract obtenerPorId(id: string): Promise<CompraDetalle | null>;
}
