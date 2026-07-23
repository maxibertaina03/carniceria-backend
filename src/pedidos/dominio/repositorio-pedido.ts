import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { Pedido } from './pedido';

export abstract class RepositorioPedido {
  abstract obtenerPorId(
    id: string,
    ctx?: ContextoTransaccion,
  ): Promise<Pedido | null>;

  abstract guardar(pedido: Pedido, ctx?: ContextoTransaccion): Promise<void>;

  abstract eliminar(id: string): Promise<void>;
}
