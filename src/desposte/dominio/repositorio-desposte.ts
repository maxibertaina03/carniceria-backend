import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { Desposte } from './desposte';

export abstract class RepositorioDesposte {
  abstract guardar(desposte: Desposte, ctx?: ContextoTransaccion): Promise<void>;
}
