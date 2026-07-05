import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { Compra } from './compra';

export abstract class RepositorioCompra {
  abstract guardar(compra: Compra, ctx?: ContextoTransaccion): Promise<void>;
}
