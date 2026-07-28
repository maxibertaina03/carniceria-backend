import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import {
  Comprobante,
  EstadoComprobante,
  TipoComprobante,
} from './comprobante';

export interface ItemComprobanteDetalle {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface ComprobanteDetalle {
  id: string;
  tipo: TipoComprobante;
  letra: string;
  puntoVenta: string;
  numero: number;
  // Número formateado para mostrar (ej. "X 0001-00000007").
  numeroFormateado: string;
  fecha: Date;
  receptorNombre: string;
  receptorDocTipo: string | null;
  receptorDocNumero: string | null;
  receptorDomicilio: string | null;
  neto: number;
  alicuotaIva: number;
  iva: number;
  total: number;
  observaciones: string | null;
  estado: EstadoComprobante;
  comprobanteOrigenId: string | null;
  comprobanteOrigenNumero: string | null;
  items: ItemComprobanteDetalle[];
}

export abstract class RepositorioComprobante {
  abstract guardar(
    comprobante: Comprobante,
    ctx?: ContextoTransaccion,
  ): Promise<void>;

  // Próximo número para un tipo/punto de venta/letra (para la numeración).
  abstract proximoNumero(
    tipo: TipoComprobante,
    puntoVenta: string,
    letra: string,
    ctx?: ContextoTransaccion,
  ): Promise<number>;

  abstract obtener(id: string): Promise<Comprobante | null>;
  abstract obtenerDetalle(id: string): Promise<ComprobanteDetalle | null>;
  abstract listar(tipo?: TipoComprobante): Promise<ComprobanteDetalle[]>;

  abstract actualizarEstado(
    id: string,
    estado: EstadoComprobante,
    ctx?: ContextoTransaccion,
  ): Promise<void>;
}
