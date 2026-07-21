import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';

// Puerto que el contexto Ventas necesita de Cuentas Corrientes: cuando una
// venta tiene monto fiado, se genera el cargo en la cuenta del cliente.
// Lo implementa el contexto Cuentas Corrientes (adaptador en su infraestructura).
export abstract class RegistradorDeudaCliente {
  // Valida que el cliente exista y esté activo (también para ventas al contado
  // asociadas a un cliente).
  abstract verificarClienteActivo(
    clienteId: string,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  abstract registrarCargoPorVenta(
    clienteId: string,
    ventaId: string,
    monto: number,
    fecha: Date,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  // Al borrar una venta fiada: baja el saldo del cliente y elimina el
  // movimiento CARGO de esa venta. Bloquea si el cliente ya pagó parte.
  abstract revertirCargoPorVenta(
    clienteId: string,
    ventaId: string,
    monto: number,
    ctx?: ContextoTransaccion,
  ): Promise<void>;
}
