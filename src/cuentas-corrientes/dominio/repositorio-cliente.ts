import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { Cliente } from './cliente';
import { MovimientoCuenta } from './movimiento-cuenta';

export abstract class RepositorioCliente {
  abstract obtenerPorId(
    id: string,
    ctx?: ContextoTransaccion,
  ): Promise<Cliente | null>;

  abstract obtenerTodos(incluirInactivos: boolean): Promise<Cliente[]>;

  abstract guardar(cliente: Cliente, ctx?: ContextoTransaccion): Promise<void>;

  abstract agregarMovimiento(
    movimiento: MovimientoCuenta,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  // Historial completo del cliente, del más reciente al más antiguo.
  abstract obtenerMovimientos(clienteId: string): Promise<MovimientoCuenta[]>;

  // Borra los movimientos asociados a una venta (al eliminar esa venta).
  abstract eliminarMovimientosDeVenta(
    ventaId: string,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  // Si el cliente tiene historial (movimientos de cuenta o ventas asociadas);
  // si lo tiene, no se puede borrar definitivamente (solo desactivar).
  abstract tieneHistorial(clienteId: string): Promise<boolean>;

  // Borra el cliente definitivamente (solo se usa cuando no tiene historial).
  abstract eliminar(id: string): Promise<void>;
}
