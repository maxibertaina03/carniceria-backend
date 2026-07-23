import { Injectable } from '@nestjs/common';
import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';
import { Dinero } from '../../../comun/dominio/dinero';
import { RegistradorDeudaProveedor } from '../../aplicacion/puertos/registrador-deuda-proveedor';
import {
  ProveedorInvalidoException,
  ProveedorNoEncontradoException,
} from '../../dominio/excepciones';
import { RepositorioProveedor } from '../../dominio/repositorio-proveedor';

// Adaptador para el puerto que usan Compras y Gastos: registra y revierte la
// deuda propia en la cuenta del proveedor.
@Injectable()
export class RegistradorDeudaProveedorProveedores extends RegistradorDeudaProveedor {
  constructor(private readonly repositorio: RepositorioProveedor) {
    super();
  }

  async verificarProveedorActivo(
    proveedorId: string,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    const proveedor = await this.repositorio.obtenerPorId(proveedorId, ctx);
    if (!proveedor) {
      throw new ProveedorNoEncontradoException(proveedorId);
    }
    if (!proveedor.activo) {
      throw new ProveedorInvalidoException(
        `El proveedor "${proveedor.nombre}" está desactivado`,
      );
    }
  }

  registrarCargoPorCompra(
    proveedorId: string,
    compraId: string,
    monto: number,
    fecha: Date,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    return this.cargar(proveedorId, monto, fecha, { compraId }, ctx);
  }

  registrarCargoPorGasto(
    proveedorId: string,
    gastoId: string,
    monto: number,
    fecha: Date,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    return this.cargar(proveedorId, monto, fecha, { gastoId }, ctx);
  }

  async registrarPagoPorGasto(
    proveedorId: string,
    gastoId: string,
    monto: number,
    fecha: Date,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    const proveedor = await this.repositorio.obtenerPorId(proveedorId, ctx);
    if (!proveedor) {
      throw new ProveedorNoEncontradoException(proveedorId);
    }
    const movimiento = proveedor.registrarPago(Dinero.desde(monto), {
      gastoId,
      fecha,
      observaciones: 'Pago de boleta',
    });
    await this.repositorio.guardar(proveedor, ctx);
    await this.repositorio.agregarMovimiento(movimiento, ctx);
  }

  limpiarMovimientosDeGasto(
    gastoId: string,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    return this.repositorio.eliminarMovimientosDeGasto(gastoId, ctx);
  }

  revertirCargoPorCompra(
    proveedorId: string,
    compraId: string,
    monto: number,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    return this.revertir(proveedorId, monto, ctx, () =>
      this.repositorio.eliminarMovimientosDeCompra(compraId, ctx),
    );
  }

  revertirCargoPorGasto(
    proveedorId: string,
    gastoId: string,
    monto: number,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    return this.revertir(proveedorId, monto, ctx, () =>
      this.repositorio.eliminarMovimientosDeGasto(gastoId, ctx),
    );
  }

  private async cargar(
    proveedorId: string,
    monto: number,
    fecha: Date,
    ref: { compraId?: string; gastoId?: string },
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    const proveedor = await this.repositorio.obtenerPorId(proveedorId, ctx);
    if (!proveedor) {
      throw new ProveedorNoEncontradoException(proveedorId);
    }
    const movimiento = proveedor.registrarCargo(Dinero.desde(monto), {
      ...ref,
      fecha,
      observaciones: ref.compraId ? 'Compra a crédito' : 'Gasto adeudado',
    });
    await this.repositorio.guardar(proveedor, ctx);
    await this.repositorio.agregarMovimiento(movimiento, ctx);
  }

  private async revertir(
    proveedorId: string,
    monto: number,
    ctx: ContextoTransaccion | undefined,
    borrarMovimientos: () => Promise<void>,
  ): Promise<void> {
    const proveedor = await this.repositorio.obtenerPorId(proveedorId, ctx);
    if (!proveedor) {
      throw new ProveedorNoEncontradoException(proveedorId);
    }
    proveedor.revertirCargo(Dinero.desde(monto));
    await this.repositorio.guardar(proveedor, ctx);
    await borrarMovimientos();
  }
}
