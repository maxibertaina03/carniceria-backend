import { Injectable } from '@nestjs/common';
import { Cantidad } from '../../../comun/dominio/cantidad';
import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';
import { Dinero } from '../../../comun/dominio/dinero';
import { GestorLotes } from '../../aplicacion/gestor-lotes';
import { AjustadorStockProducto } from '../../aplicacion/puertos/ajustador-stock-producto';
import { ProductoNoEncontradoException } from '../../dominio/excepciones';
import { RepositorioProducto } from '../../dominio/repositorio-producto';

@Injectable()
export class AjustadorStockProductoCatalogo extends AjustadorStockProducto {
  constructor(
    private readonly repositorio: RepositorioProducto,
    private readonly gestorLotes: GestorLotes,
  ) {
    super();
  }

  async aumentarStock(
    productoId: string,
    cantidad: number,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    const producto = await this.repositorio.obtenerPorId(productoId, ctx);
    if (!producto) {
      throw new ProductoNoEncontradoException(productoId);
    }
    producto.aumentarStock(Cantidad.desde(cantidad, producto.unidadMedida));
    await this.repositorio.guardar(producto, ctx);
    // Una devolución al stock (reversión de venta/producción) también crea lote.
    await this.gestorLotes.registrarIngreso(productoId, cantidad, ctx);
  }

  async fijarCostoReferencia(
    productoId: string,
    costo: number,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    const producto = await this.repositorio.obtenerPorId(productoId, ctx);
    if (!producto) {
      throw new ProductoNoEncontradoException(productoId);
    }
    producto.actualizarPreciosReferencia(Dinero.desde(costo));
    await this.repositorio.guardar(producto, ctx);
  }
}
