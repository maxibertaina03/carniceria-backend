import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { Desposte } from './desposte';

export abstract class RepositorioDesposte {
  abstract guardar(desposte: Desposte, ctx?: ContextoTransaccion): Promise<void>;

  abstract eliminar(id: string, ctx?: ContextoTransaccion): Promise<void>;
}
