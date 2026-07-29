import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { Lote } from './lote';

export interface LoteVencimiento {
  productoId: string;
  nombreProducto: string;
  fechaVencimiento: Date | null;
  cantidadDisponible: number;
}

export abstract class RepositorioLote {
  abstract guardar(lote: Lote, ctx?: ContextoTransaccion): Promise<void>;

  // Lotes con stock disponible de un producto, ordenados por vencimiento
  // (los que vencen antes primero; los sin vencimiento al final).
  abstract disponiblesDeProducto(
    productoId: string,
    ctx?: ContextoTransaccion,
  ): Promise<Lote[]>;

  abstract actualizarDisponible(
    id: string,
    cantidadDisponible: number,
    ctx?: ContextoTransaccion,
  ): Promise<void>;
}
