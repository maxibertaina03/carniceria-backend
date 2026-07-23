import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { Gasto } from './gasto';

export interface GastoDetalle {
  id: string;
  fecha: Date;
  concepto: string;
  categoria: string | null;
  monto: number;
  adeudado: boolean;
  fechaVencimiento: Date | null;
  pagado: boolean;
  proveedorId: string | null;
  proveedorNombre: string | null;
  observaciones: string | null;
}

export abstract class RepositorioGasto {
  abstract guardar(gasto: Gasto, ctx?: ContextoTransaccion): Promise<void>;
  abstract obtenerDetalle(id: string): Promise<GastoDetalle | null>;
  abstract listar(): Promise<GastoDetalle[]>;
  abstract marcarPagado(id: string, ctx?: ContextoTransaccion): Promise<void>;
  abstract eliminar(id: string, ctx?: ContextoTransaccion): Promise<void>;
}
