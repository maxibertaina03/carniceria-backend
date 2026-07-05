import { Cliente } from '../../dominio/cliente';
import { MovimientoCuenta } from '../../dominio/movimiento-cuenta';

export interface ClienteRespuesta {
  id: string;
  nombre: string;
  telefono: string | null;
  saldoDeudor: number;
  activo: boolean;
  fechaCreacion: Date;
}

export interface MovimientoRespuesta {
  id: string;
  tipo: string;
  monto: number;
  fecha: Date;
  ventaId: string | null;
  observaciones: string | null;
}

export function aClienteRespuesta(cliente: Cliente): ClienteRespuesta {
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    telefono: cliente.telefono,
    saldoDeudor: cliente.saldoDeudor,
    activo: cliente.activo,
    fechaCreacion: cliente.fechaCreacion,
  };
}

export function aMovimientoRespuesta(
  movimiento: MovimientoCuenta,
): MovimientoRespuesta {
  return {
    id: movimiento.id,
    tipo: movimiento.tipo,
    monto: movimiento.monto,
    fecha: movimiento.fecha,
    ventaId: movimiento.ventaId,
    observaciones: movimiento.observaciones,
  };
}
