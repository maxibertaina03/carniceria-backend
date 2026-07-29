import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { Presentacion } from './presentacion';

export abstract class RepositorioPresentacion {
  abstract guardar(
    presentacion: Presentacion,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  abstract obtenerPorId(
    id: string,
    ctx?: ContextoTransaccion,
  ): Promise<Presentacion | null>;

  // Todas las presentaciones activas (opcionalmente de un producto).
  abstract listar(productoId?: string): Promise<Presentacion[]>;

  abstract eliminar(id: string): Promise<void>;
}
