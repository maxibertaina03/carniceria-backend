import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';

// Capacidad publicada por Proveedores: registrar y revertir deudas propias.
// La usan Compras (compra a crédito) y Gastos (gasto adeudado).
export abstract class RegistradorDeudaProveedor {
  abstract verificarProveedorActivo(
    proveedorId: string,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  abstract registrarCargoPorCompra(
    proveedorId: string,
    compraId: string,
    monto: number,
    fecha: Date,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  abstract registrarCargoPorGasto(
    proveedorId: string,
    gastoId: string,
    monto: number,
    fecha: Date,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  // Al borrar una compra/gasto adeudado: baja el saldo y borra sus movimientos.
  // Bloquea si ya se pagó parte de esa deuda.
  abstract revertirCargoPorCompra(
    proveedorId: string,
    compraId: string,
    monto: number,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  abstract revertirCargoPorGasto(
    proveedorId: string,
    gastoId: string,
    monto: number,
    ctx?: ContextoTransaccion,
  ): Promise<void>;
}
