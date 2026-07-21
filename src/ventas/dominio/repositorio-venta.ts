import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { Venta } from './venta';

export abstract class RepositorioVenta {
  abstract guardar(venta: Venta, ctx?: ContextoTransaccion): Promise<void>;

  abstract eliminar(id: string, ctx?: ContextoTransaccion): Promise<void>;
}
