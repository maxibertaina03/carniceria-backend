import { Injectable } from '@nestjs/common';
import { Cantidad } from '../../../comun/dominio/cantidad';
import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';
import { DescontadorStockProducto } from '../../../ventas/aplicacion/puertos/descontador-stock-producto';
import { ProductoNoEncontradoException } from '../../dominio/excepciones';
import { RepositorioProducto } from '../../dominio/repositorio-producto';

// Adaptador del Catálogo para el puerto que define Ventas: descuenta stock
// aplicando la invariante del dominio (el stock no puede quedar negativo).
@Injectable()
export class DescontadorStockProductoCatalogo extends DescontadorStockProducto {
  constructor(private readonly repositorio: RepositorioProducto) {
    super();
  }

  async descontarPorVenta(
    productoId: string,
    cantidad: number,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    const producto = await this.repositorio.obtenerPorId(productoId, ctx);
    if (!producto) {
      throw new ProductoNoEncontradoException(productoId);
    }
    producto.disminuirStock(Cantidad.desde(cantidad, producto.unidadMedida));
    await this.repositorio.guardar(producto, ctx);
  }
}
