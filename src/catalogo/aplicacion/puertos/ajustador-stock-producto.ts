import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';

// Capacidades de escritura del Catálogo usadas por otros contextos:
// - aumentarStock: sube el stock SIN tocar el costo (reversión de ventas/producción).
// - fijarCostoReferencia: fija el costo de referencia SIN tocar el stock
//   (recálculo de costos de productos producidos según su receta).
export abstract class AjustadorStockProducto {
  abstract aumentarStock(
    productoId: string,
    cantidad: number,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  abstract fijarCostoReferencia(
    productoId: string,
    costo: number,
    ctx?: ContextoTransaccion,
  ): Promise<void>;
}
