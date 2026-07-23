// Puerto que Pedidos necesita de Ventas: al entregar un pedido se genera una
// venta reutilizando toda la lógica de ventas (descuento de stock con bloqueo,
// cálculo de ganancia y, si es fiado, la deuda del cliente). Lo implementa el
// contexto Ventas.
export interface DatosVentaDesdePedido {
  clienteId?: string;
  montoFiado?: number;
  observaciones?: string;
  items: {
    productoId: string;
    cantidad: number;
    precioUnitarioVenta: number;
  }[];
}

export abstract class RegistradorVentaDesdePedido {
  // Registra la venta y devuelve su id.
  abstract registrarVenta(datos: DatosVentaDesdePedido): Promise<string>;
}
