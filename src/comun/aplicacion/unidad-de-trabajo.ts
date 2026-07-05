import { ContextoTransaccion } from '../dominio/contexto-transaccion';

// Puerto para ejecutar una operación completa dentro de una única transacción.
export abstract class UnidadDeTrabajo {
  abstract ejecutar<T>(
    trabajo: (ctx: ContextoTransaccion) => Promise<T>,
  ): Promise<T>;
}
