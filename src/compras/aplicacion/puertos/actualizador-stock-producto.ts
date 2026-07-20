import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';

// Capacidad publicada por el contexto Catálogo: registrar un ingreso de stock
// de un producto y dejar el costo pagado como nuevo costo de referencia.
// Lo reutilizan Compras (ingreso por compra), Desposte (ingreso de cada corte)
// y Producción (ingreso del producto terminado). Lo implementa el Catálogo.
export abstract class ActualizadorStockProducto {
  abstract registrarIngreso(
    productoId: string,
    cantidad: number,
    costoUnitario: number,
    ctx?: ContextoTransaccion,
  ): Promise<void>;
}
