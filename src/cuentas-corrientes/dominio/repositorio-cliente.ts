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
}
