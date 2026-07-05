import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';

// Puerto que el contexto Ventas necesita del Catálogo: al confirmar una venta,
// descontar stock. Si no alcanza, el Catálogo lanza StockInsuficienteException
// y toda la venta se cancela (la transacción hace rollback).
// Lo implementa el contexto Catálogo (adaptador en su infraestructura).
export abstract class DescontadorStockProducto {
  abstract descontarPorVenta(
    productoId: string,
    cantidad: number,
    ctx?: ContextoTransaccion,
  ): Promise<void>;
}
