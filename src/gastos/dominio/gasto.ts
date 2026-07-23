import { randomUUID } from 'crypto';
import { Dinero } from '../../comun/dominio/dinero';
import { ExcepcionDominio } from '../../comun/dominio/excepcion-dominio';

export class GastoInvalidoException extends ExcepcionDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class GastoNoEncontradoException extends ExcepcionDominio {
  constructor(id: string) {
    super(`No se encontró el gasto con id ${id}`, 404);
  }
}

export interface PropiedadesGasto {
  id: string;
  fecha: Date;
  concepto: string;
  categoria: string | null;
  monto: number;
  // Si es adeudado, se registra como deuda al proveedor de abajo.
  adeudado: boolean;
  // Cuándo vence la boleta (solo si está adeudada).
  fechaVencimiento: Date | null;
  // Si la boleta ya se pagó. Los gastos al contado nacen pagados.
  pagado: boolean;
  proveedorId: string | null;
  observaciones: string | null;
}

// Un gasto del negocio que no es mercadería (alquiler, luz, sueldos, etc.).
// Puede estar pagado (salió plata ya) o adeudado (queda a deber a un proveedor).
export class Gasto {
  private constructor(private readonly props: PropiedadesGasto) {}

  static crear(datos: {
    concepto: string;
    categoria?: string;
    monto: number;
    adeudado?: boolean;
    fechaVencimiento?: Date;
    proveedorId?: string;
    observaciones?: string;
    fecha?: Date;
  }): Gasto {
    const concepto = datos.concepto?.trim();
    if (!concepto) {
      throw new GastoInvalidoException('El gasto necesita un concepto');
    }
    const monto = Dinero.desde(datos.monto);
    if (monto.esCero()) {
      throw new GastoInvalidoException('El monto del gasto debe ser mayor a cero');
    }
    const adeudado = datos.adeudado ?? false;
    if (adeudado && !datos.proveedorId) {
      throw new GastoInvalidoException(
        'Para dejar un gasto a deber hay que elegir el proveedor',
      );
    }
    return new Gasto({
      id: randomUUID(),
      fecha: datos.fecha ?? new Date(),
      concepto,
      categoria: datos.categoria?.trim() || null,
      monto: monto.monto,
      adeudado,
      // El vencimiento solo aplica a boletas que quedan a deber.
      fechaVencimiento: adeudado ? (datos.fechaVencimiento ?? null) : null,
      // Al contado nace pagado; adeudado nace pendiente de pago.
      pagado: !adeudado,
      proveedorId: adeudado ? (datos.proveedorId ?? null) : null,
      observaciones: datos.observaciones?.trim() || null,
    });
  }

  static reconstruir(props: PropiedadesGasto): Gasto {
    return new Gasto({ ...props });
  }

  get id() {
    return this.props.id;
  }
  get fecha() {
    return this.props.fecha;
  }
  get concepto() {
    return this.props.concepto;
  }
  get categoria() {
    return this.props.categoria;
  }
  get monto() {
    return this.props.monto;
  }
  get adeudado() {
    return this.props.adeudado;
  }
  get fechaVencimiento() {
    return this.props.fechaVencimiento;
  }
  get pagado() {
    return this.props.pagado;
  }
  get proveedorId() {
    return this.props.proveedorId;
  }
  get observaciones() {
    return this.props.observaciones;
  }

  // Marca la boleta como pagada. Solo aplica a gastos adeudados pendientes.
  marcarPagado(): void {
    if (this.props.pagado) {
      throw new GastoInvalidoException('Esta boleta ya figura como pagada');
    }
    this.props.pagado = true;
  }
}
