import { Injectable } from '@nestjs/common';
import { Cantidad } from '../../../comun/dominio/cantidad';
import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';
import { Dinero } from '../../../comun/dominio/dinero';
import { ActualizadorStockProducto } from '../../../compras/aplicacion/puertos/actualizador-stock-producto';
import { GestorLotes } from '../../aplicacion/gestor-lotes';
import { ProductoNoEncontradoException } from '../../dominio/excepciones';
import { RepositorioProducto } from '../../dominio/repositorio-producto';

// Adaptador del Catálogo para el puerto que define Compras: una compra
// confirmada suma stock y deja el costo pagado como nuevo costo de referencia.
@Injectable()
export class ActualizadorStockProductoCatalogo extends ActualizadorStockProducto {
  constructor(
    private readonly repositorio: RepositorioProducto,
    private readonly gestorLotes: GestorLotes,
  ) {
    super();
  }

  async registrarIngreso(
    productoId: string,
    cantidad: number,
    costoUnitario: number,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    const producto = await this.repositorio.obtenerPorId(productoId, ctx);
    if (!producto) {
      throw new ProductoNoEncontradoException(productoId);
    }
    producto.aumentarStock(Cantidad.desde(cantidad, producto.unidadMedida));
    producto.actualizarPreciosReferencia(Dinero.desde(costoUnitario));
    await this.repositorio.guardar(producto, ctx);
    // Si el rubro usa lotes, el ingreso crea un lote (con su vencimiento).
    await this.gestorLotes.registrarIngreso(productoId, cantidad, ctx);
  }
}
