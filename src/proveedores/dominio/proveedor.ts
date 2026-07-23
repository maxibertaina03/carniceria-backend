import { randomUUID } from 'crypto';
import { Dinero } from '../../comun/dominio/dinero';
import { redondearMoneda } from '../../comun/dominio/redondeo';
import {
  PagoProveedorInvalidoException,
  ProveedorInvalidoException,
} from './excepciones';
import { MovimientoProveedor } from './movimiento-proveedor';

export interface PropiedadesProveedor {
  id: string;
  nombre: string;
  telefono: string | null;
  saldoAdeudado: number;
  activo: boolean;
  fechaCreacion: Date;
}

// Aggregate root de cuentas por pagar. El saldo es lo que YO le debo al
// proveedor. Invariante: saldoAdeudado = suma de cargos − suma de pagos.
export class Proveedor {
  private constructor(private readonly props: PropiedadesProveedor) {}

  static crear(datos: { nombre: string; telefono?: string }): Proveedor {
    return new Proveedor({
      id: randomUUID(),
      nombre: Proveedor.validarNombre(datos.nombre),
      telefono: datos.telefono?.trim() || null,
      saldoAdeudado: 0,
      activo: true,
      fechaCreacion: new Date(),
    });
  }

  static reconstruir(props: PropiedadesProveedor): Proveedor {
    return new Proveedor({ ...props });
  }

  private static validarNombre(nombre: string): string {
    const limpio = nombre?.trim();
    if (!limpio) {
      throw new ProveedorInvalidoException(
        'El nombre del proveedor no puede estar vacío',
      );
    }
    return limpio;
  }

  get id() {
    return this.props.id;
  }
  get nombre() {
    return this.props.nombre;
  }
  get telefono() {
    return this.props.telefono;
  }
  get saldoAdeudado() {
    return this.props.saldoAdeudado;
  }
  get activo() {
    return this.props.activo;
  }
  get fechaCreacion() {
    return this.props.fechaCreacion;
  }

  actualizarDatos(datos: { nombre?: string; telefono?: string }): void {
    if (datos.nombre !== undefined) {
      this.props.nombre = Proveedor.validarNombre(datos.nombre);
    }
    if (datos.telefono !== undefined) {
      this.props.telefono = datos.telefono.trim() || null;
    }
  }

  // Genero una deuda (compra o gasto que quedó a deber).
  registrarCargo(
    monto: Dinero,
    datos: {
      compraId?: string;
      gastoId?: string;
      observaciones?: string;
      fecha?: Date;
    } = {},
  ): MovimientoProveedor {
    if (!this.props.activo) {
      throw new ProveedorInvalidoException(
        `El proveedor "${this.props.nombre}" está desactivado`,
      );
    }
    if (monto.esCero()) {
      throw new ProveedorInvalidoException('El cargo debe ser mayor a cero');
    }
    this.props.saldoAdeudado = redondearMoneda(
      this.props.saldoAdeudado + monto.monto,
    );
    return MovimientoProveedor.cargo(this.props.id, monto, datos);
  }

  // Le pago (total o parcial).
  registrarPago(monto: Dinero, observaciones?: string): MovimientoProveedor {
    if (monto.esCero()) {
      throw new PagoProveedorInvalidoException('El pago debe ser mayor a cero');
    }
    if (monto.monto > this.props.saldoAdeudado) {
      throw new PagoProveedorInvalidoException(
        `El pago ($${monto.monto}) supera lo que le debés al proveedor ($${this.props.saldoAdeudado})`,
      );
    }
    this.props.saldoAdeudado = redondearMoneda(
      this.props.saldoAdeudado - monto.monto,
    );
    return MovimientoProveedor.pago(this.props.id, monto, { observaciones });
  }

  // Revierte un cargo (al borrar la compra/gasto que lo generó). Se bloquea si
  // ya se pagó parte, porque el saldo no alcanzaría para revertirlo.
  revertirCargo(monto: Dinero): void {
    if (monto.monto > this.props.saldoAdeudado) {
      throw new ProveedorInvalidoException(
        `No se puede borrar: ya le pagaste parte de esta deuda a "${this.props.nombre}". Ajustá los pagos primero.`,
      );
    }
    this.props.saldoAdeudado = redondearMoneda(
      this.props.saldoAdeudado - monto.monto,
    );
  }

  desactivar(): void {
    if (this.props.saldoAdeudado > 0) {
      throw new ProveedorInvalidoException(
        `No se puede desactivar a "${this.props.nombre}": todavía le debés $${this.props.saldoAdeudado}`,
      );
    }
    this.props.activo = false;
  }

  activar(): void {
    this.props.activo = true;
  }
}
