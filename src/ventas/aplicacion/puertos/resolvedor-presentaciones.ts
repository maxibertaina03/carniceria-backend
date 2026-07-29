import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';

export interface PresentacionResuelta {
  productoId: string;
  // Cuánto del stock base representa 1 unidad de la presentación.
  cantidadEquivalente: number;
  // Precio de 1 unidad de la presentación.
  precio: number;
}

// Puerto que Ventas usa para resolver una presentación a producto + cantidad
// base + precio. Lo implementa el Catálogo.
export abstract class ResolvedorPresentaciones {
  abstract resolver(
    presentacionId: string,
    ctx?: ContextoTransaccion,
  ): Promise<PresentacionResuelta | null>;
}
