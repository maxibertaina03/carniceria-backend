// Modelo de lectura de ventas (incluye nombres de producto y cliente para la UI).
export interface ItemVentaDetalle {
  id: string;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitarioVenta: number;
  costoUnitario: number;
  subtotal: number;
  gananciaLinea: number;
}

export interface VentaDetalle {
  id: string;
  fecha: Date;
  clienteId: string | null;
  clienteNombre: string | null;
  total: number;
  montoContado: number;
  montoFiado: number;
  formaPago: string;
  gananciaTotal: number;
  observaciones: string | null;
  items: ItemVentaDetalle[];
}

export abstract class ConsultaVentas {
  abstract obtenerTodas(): Promise<VentaDetalle[]>;
  abstract obtenerPorId(id: string): Promise<VentaDetalle | null>;
}
