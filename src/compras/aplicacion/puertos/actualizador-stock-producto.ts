import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';

// Puerto que el contexto Compras necesita del Catálogo: al confirmar una
// compra, sumar stock y actualizar el costo de referencia del producto.
// Lo implementa el contexto Catálogo (adaptador en su infraestructura).
export abstract class ActualizadorStockProducto {
  abstract registrarIngresoPorCompra(
    productoId: string,
    cantidad: number,
    costoUnitario: number,
    ctx?: ContextoTransaccion,
  ): Promise<void>;
}
