import { Injectable } from '@nestjs/common';
import { UnidadDeTrabajo } from '../../comun/aplicacion/unidad-de-trabajo';
import { RegistradorDeudaProveedor } from '../../proveedores/aplicacion/puertos/registrador-deuda-proveedor';
import { Gasto, GastoNoEncontradoException } from '../dominio/gasto';
import { GastoDetalle, RepositorioGasto } from '../dominio/repositorio-gasto';

export interface DatosGasto {
  concepto: string;
  categoria?: string;
  monto: number;
  adeudado?: boolean;
  proveedorId?: string;
  observaciones?: string;
  fecha?: Date;
}

@Injectable()
export class ServicioGastos {
  constructor(
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly repositorio: RepositorioGasto,
    private readonly registradorDeuda: RegistradorDeudaProveedor,
  ) {}

  listar(): Promise<GastoDetalle[]> {
    return this.repositorio.listar();
  }

  async obtener(id: string): Promise<GastoDetalle> {
    const gasto = await this.repositorio.obtenerDetalle(id);
    if (!gasto) {
      throw new GastoNoEncontradoException(id);
    }
    return gasto;
  }

  // Registra el gasto. Si es adeudado, en la misma transacción genera la deuda
  // en la cuenta del proveedor.
  async crear(datos: DatosGasto): Promise<GastoDetalle> {
    const gastoId = await this.unidadDeTrabajo.ejecutar(async (ctx) => {
      const gasto = Gasto.crear(datos);
      if (gasto.adeudado && gasto.proveedorId) {
        await this.registradorDeuda.verificarProveedorActivo(
          gasto.proveedorId,
          ctx,
        );
      }
      await this.repositorio.guardar(gasto, ctx);
      if (gasto.adeudado && gasto.proveedorId) {
        await this.registradorDeuda.registrarCargoPorGasto(
          gasto.proveedorId,
          gasto.id,
          gasto.monto,
          gasto.fecha,
          ctx,
        );
      }
      return gasto.id;
    });
    return this.obtener(gastoId);
  }

  // Borra el gasto; si era adeudado, revierte la deuda (bloquea si ya se pagó parte).
  async eliminar(id: string): Promise<void> {
    const gasto = await this.obtener(id);
    await this.unidadDeTrabajo.ejecutar(async (ctx) => {
      if (gasto.adeudado && gasto.proveedorId) {
        await this.registradorDeuda.revertirCargoPorGasto(
          gasto.proveedorId,
          gasto.id,
          gasto.monto,
          ctx,
        );
      }
      await this.repositorio.eliminar(id, ctx);
    });
  }
}
