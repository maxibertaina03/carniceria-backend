import { randomUUID } from 'crypto';
import { Dinero } from '../../comun/dominio/dinero';
import { redondearMoneda } from '../../comun/dominio/redondeo';
import {
  ClienteInvalidoException,
  PagoInvalidoException,
} from './excepciones';
import { MovimientoCuenta } from './movimiento-cuenta';

export interface PropiedadesCliente {
  id: string;
  nombre: string;
  telefono: string | null;
  saldoDeudor: number;
  activo: boolean;
  fechaCreacion: Date;
}

// Aggregate root de cuentas corrientes. Invariante: el saldo deudor siempre
// es la suma de cargos menos la suma de pagos; se actualiza acá mismo cada
// vez que se genera un movimiento, en la misma transacción.
export class Cliente {
  private constructor(private readonly props: PropiedadesCliente) {}

  static crear(datos: { nombre: string; telefono?: string }): Cliente {
    return new Cliente({
      id: randomUUID(),
      nombre: Cliente.validarNombre(datos.nombre),
      telefono: datos.telefono?.trim() || null,
      saldoDeudor: 0,
      activo: true,
      fechaCreacion: new Date(),
    });
  }

  static reconstruir(props: PropiedadesCliente): Cliente {
    return new Cliente({ ...props });
  }

  private static validarNombre(nombre: string): string {
    const limpio = nombre?.trim();
    if (!limpio) {
      throw new ClienteInvalidoException(
        'El nombre del cliente no puede estar vacío',
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
  get saldoDeudor() {
    return this.props.saldoDeudor;
  }
  get activo() {
    return this.props.activo;
  }
  get fechaCreacion() {
    return this.props.fechaCreacion;
  }

  actualizarDatos(datos: { nombre?: string; telefono?: string }): void {
    if (datos.nombre !== undefined) {
      this.props.nombre = Cliente.validarNombre(datos.nombre);
    }
    if (datos.telefono !== undefined) {
      this.props.telefono = datos.telefono.trim() || null;
    }
  }

  registrarCargo(
    monto: Dinero,
    datos: { ventaId?: string; observaciones?: string; fecha?: Date } = {},
  ): MovimientoCuenta {
    if (!this.props.activo) {
      throw new ClienteInvalidoException(
        `El cliente "${this.props.nombre}" está desactivado: no se le puede fiar`,
      );
    }
    if (monto.esCero()) {
      throw new ClienteInvalidoException('El cargo debe ser mayor a cero');
    }
    this.props.saldoDeudor = redondearMoneda(
      this.props.saldoDeudor + monto.monto,
    );
    return MovimientoCuenta.cargo(this.props.id, monto, datos);
  }

  registrarPago(monto: Dinero, observaciones?: string): MovimientoCuenta {
    if (monto.esCero()) {
      throw new PagoInvalidoException('El pago debe ser mayor a cero');
    }
    if (monto.monto > this.props.saldoDeudor) {
      throw new PagoInvalidoException(
        `El pago ($${monto.monto}) supera la deuda actual del cliente ($${this.props.saldoDeudor})`,
      );
    }
    this.props.saldoDeudor = redondearMoneda(
      this.props.saldoDeudor - monto.monto,
    );
    return MovimientoCuenta.pago(this.props.id, monto, { observaciones });
  }

  // Revierte un cargo (al borrar la venta fiada que lo generó). Se bloquea si
  // el cliente ya pagó parte, porque el saldo no alcanzaría para revertirlo.
  revertirCargo(monto: Dinero): void {
    if (monto.monto > this.props.saldoDeudor) {
      throw new ClienteInvalidoException(
        `No se puede borrar esta venta fiada: "${this.props.nombre}" ya pagó parte de su deuda. Primero ajustá los pagos.`,
      );
    }
    this.props.saldoDeudor = redondearMoneda(
      this.props.saldoDeudor - monto.monto,
    );
  }

  desactivar(): void {
    if (this.props.saldoDeudor > 0) {
      throw new ClienteInvalidoException(
        `No se puede desactivar a "${this.props.nombre}": todavía debe $${this.props.saldoDeudor}`,
      );
    }
    this.props.activo = false;
  }

  activar(): void {
    this.props.activo = true;
  }
}
