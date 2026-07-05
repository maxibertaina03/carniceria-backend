import { randomUUID } from 'crypto';
import { Dinero } from '../../comun/dominio/dinero';

// CARGO: deuda generada por una venta fiada. PAGO: entrega del cliente.
export type TipoMovimiento = 'CARGO' | 'PAGO';

export interface PropiedadesMovimiento {
  id: string;
  clienteId: string;
  tipo: TipoMovimiento;
  monto: number;
  fecha: Date;
  ventaId: string | null;
  observaciones: string | null;
}

export class MovimientoCuenta {
  private constructor(private readonly props: PropiedadesMovimiento) {}

  static cargo(
    clienteId: string,
    monto: Dinero,
    datos: { ventaId?: string; observaciones?: string; fecha?: Date } = {},
  ): MovimientoCuenta {
    return new MovimientoCuenta({
      id: randomUUID(),
      clienteId,
      tipo: 'CARGO',
      monto: monto.monto,
      fecha: datos.fecha ?? new Date(),
      ventaId: datos.ventaId ?? null,
      observaciones: datos.observaciones?.trim() || null,
    });
  }

  static pago(
    clienteId: string,
    monto: Dinero,
    datos: { observaciones?: string; fecha?: Date } = {},
  ): MovimientoCuenta {
    return new MovimientoCuenta({
      id: randomUUID(),
      clienteId,
      tipo: 'PAGO',
      monto: monto.monto,
      fecha: datos.fecha ?? new Date(),
      ventaId: null,
      observaciones: datos.observaciones?.trim() || null,
    });
  }

  static reconstruir(props: PropiedadesMovimiento): MovimientoCuenta {
    return new MovimientoCuenta({ ...props });
  }

  get id() {
    return this.props.id;
  }
  get clienteId() {
    return this.props.clienteId;
  }
  get tipo() {
    return this.props.tipo;
  }
  get monto() {
    return this.props.monto;
  }
  get fecha() {
    return this.props.fecha;
  }
  get ventaId() {
    return this.props.ventaId;
  }
  get observaciones() {
    return this.props.observaciones;
  }
}
