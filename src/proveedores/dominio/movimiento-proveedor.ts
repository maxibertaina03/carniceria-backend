import { randomUUID } from 'crypto';
import { Dinero } from '../../comun/dominio/dinero';

// CARGO: deuda que genero (compra o gasto adeudado). PAGO: lo que le pago.
export type TipoMovimiento = 'CARGO' | 'PAGO';

export interface PropiedadesMovimiento {
  id: string;
  proveedorId: string;
  tipo: TipoMovimiento;
  monto: number;
  fecha: Date;
  compraId: string | null;
  gastoId: string | null;
  observaciones: string | null;
}

export class MovimientoProveedor {
  private constructor(private readonly props: PropiedadesMovimiento) {}

  static cargo(
    proveedorId: string,
    monto: Dinero,
    datos: {
      compraId?: string;
      gastoId?: string;
      observaciones?: string;
      fecha?: Date;
    } = {},
  ): MovimientoProveedor {
    return new MovimientoProveedor({
      id: randomUUID(),
      proveedorId,
      tipo: 'CARGO',
      monto: monto.monto,
      fecha: datos.fecha ?? new Date(),
      compraId: datos.compraId ?? null,
      gastoId: datos.gastoId ?? null,
      observaciones: datos.observaciones?.trim() || null,
    });
  }

  static pago(
    proveedorId: string,
    monto: Dinero,
    datos: { observaciones?: string; fecha?: Date } = {},
  ): MovimientoProveedor {
    return new MovimientoProveedor({
      id: randomUUID(),
      proveedorId,
      tipo: 'PAGO',
      monto: monto.monto,
      fecha: datos.fecha ?? new Date(),
      compraId: null,
      gastoId: null,
      observaciones: datos.observaciones?.trim() || null,
    });
  }

  static reconstruir(props: PropiedadesMovimiento): MovimientoProveedor {
    return new MovimientoProveedor({ ...props });
  }

  get id() {
    return this.props.id;
  }
  get proveedorId() {
    return this.props.proveedorId;
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
  get compraId() {
    return this.props.compraId;
  }
  get gastoId() {
    return this.props.gastoId;
  }
  get observaciones() {
    return this.props.observaciones;
  }
}
