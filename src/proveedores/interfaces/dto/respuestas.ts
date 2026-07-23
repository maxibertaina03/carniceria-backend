import { MovimientoProveedor } from '../../dominio/movimiento-proveedor';
import { Proveedor } from '../../dominio/proveedor';

export interface ProveedorRespuesta {
  id: string;
  nombre: string;
  telefono: string | null;
  saldoAdeudado: number;
  activo: boolean;
  fechaCreacion: Date;
}

export interface MovimientoRespuesta {
  id: string;
  tipo: string;
  monto: number;
  fecha: Date;
  compraId: string | null;
  gastoId: string | null;
  observaciones: string | null;
}

export function aProveedorRespuesta(proveedor: Proveedor): ProveedorRespuesta {
  return {
    id: proveedor.id,
    nombre: proveedor.nombre,
    telefono: proveedor.telefono,
    saldoAdeudado: proveedor.saldoAdeudado,
    activo: proveedor.activo,
    fechaCreacion: proveedor.fechaCreacion,
  };
}

export function aMovimientoRespuesta(
  movimiento: MovimientoProveedor,
): MovimientoRespuesta {
  return {
    id: movimiento.id,
    tipo: movimiento.tipo,
    monto: movimiento.monto,
    fecha: movimiento.fecha,
    compraId: movimiento.compraId,
    gastoId: movimiento.gastoId,
    observaciones: movimiento.observaciones,
  };
}
