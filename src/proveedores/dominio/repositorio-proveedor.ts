import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { MovimientoProveedor } from './movimiento-proveedor';
import { Proveedor } from './proveedor';

export abstract class RepositorioProveedor {
  abstract obtenerPorId(
    id: string,
    ctx?: ContextoTransaccion,
  ): Promise<Proveedor | null>;

  abstract obtenerTodos(incluirInactivos: boolean): Promise<Proveedor[]>;

  abstract guardar(
    proveedor: Proveedor,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  abstract agregarMovimiento(
    movimiento: MovimientoProveedor,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  abstract obtenerMovimientos(
    proveedorId: string,
  ): Promise<MovimientoProveedor[]>;

  // Borra los movimientos asociados a una compra o gasto (al eliminarlos).
  abstract eliminarMovimientosDeCompra(
    compraId: string,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  abstract eliminarMovimientosDeGasto(
    gastoId: string,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  // Si tiene historial (movimientos, compras o gastos): no se puede borrar.
  abstract tieneHistorial(proveedorId: string): Promise<boolean>;

  abstract eliminar(id: string): Promise<void>;
}
