import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { OrdenProduccion } from './orden-produccion';
import { Receta } from './receta';

export abstract class RepositorioReceta {
  abstract obtenerPorProducto(
    productoTerminadoId: string,
    ctx?: ContextoTransaccion,
  ): Promise<Receta | null>;

  abstract obtenerTodas(): Promise<Receta[]>;

  // Crea o reemplaza la receta (y sus ingredientes) del producto.
  abstract guardar(receta: Receta, ctx?: ContextoTransaccion): Promise<void>;

  abstract eliminar(productoTerminadoId: string): Promise<void>;
}

export abstract class RepositorioOrdenProduccion {
  abstract guardar(
    orden: OrdenProduccion,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  abstract eliminar(id: string, ctx?: ContextoTransaccion): Promise<void>;
}
