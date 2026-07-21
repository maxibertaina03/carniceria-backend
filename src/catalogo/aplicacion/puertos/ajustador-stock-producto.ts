import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';

// Capacidad publicada por el Catálogo para revertir movimientos: sube el stock
// de un producto SIN tocar su costo de referencia. La usan las eliminaciones
// de ventas y producciones (devolver al stock lo que se había descontado).
export abstract class AjustadorStockProducto {
  abstract aumentarStock(
    productoId: string,
    cantidad: number,
    ctx?: ContextoTransaccion,
  ): Promise<void>;
}
