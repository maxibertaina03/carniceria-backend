import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';

// Capacidad publicada por el Catálogo: descontar stock de un producto. Si no
// alcanza, lanza StockInsuficienteException y la operación se cancela entera
// (rollback de la transacción). La usan Ventas (al vender) y Producción (al
// consumir ingredientes). La implementa el contexto Catálogo.
export abstract class DescontadorStockProducto {
  abstract descontar(
    productoId: string,
    cantidad: number,
    ctx?: ContextoTransaccion,
  ): Promise<void>;
}
