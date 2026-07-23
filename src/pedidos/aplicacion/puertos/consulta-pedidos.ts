// Modelo de lectura de pedidos (con nombres para la UI).
export interface ItemPedidoDetalle {
  productoId: string;
  productoNombre: string;
  unidadMedida: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PedidoDetalle {
  id: string;
  fecha: Date;
  clienteId: string | null;
  clienteNombre: string | null;
  nombreContacto: string | null;
  telefono: string | null;
  fechaEntrega: Date | null;
  estado: string;
  observaciones: string | null;
  ventaId: string | null;
  total: number;
  items: ItemPedidoDetalle[];
}

export abstract class ConsultaPedidos {
  // Lista los pedidos; si `soloPendientes`, solo los que faltan entregar.
  abstract listar(soloPendientes: boolean): Promise<PedidoDetalle[]>;
  abstract obtenerPorId(id: string): Promise<PedidoDetalle | null>;
}
