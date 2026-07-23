import { Injectable } from '@nestjs/common';
import {
  MovimientoProveedor as MovimientoPrisma,
  Proveedor as ProveedorPrisma,
} from '@prisma/client';
import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { clienteDeContexto } from '../../comun/infraestructura/cliente-de-contexto';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import {
  MovimientoProveedor,
  TipoMovimiento,
} from '../dominio/movimiento-proveedor';
import { Proveedor } from '../dominio/proveedor';
import { RepositorioProveedor } from '../dominio/repositorio-proveedor';

@Injectable()
export class RepositorioProveedorPrisma extends RepositorioProveedor {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async obtenerPorId(
    id: string,
    ctx?: ContextoTransaccion,
  ): Promise<Proveedor | null> {
    const fila = await clienteDeContexto(this.prisma, ctx).proveedor.findUnique({
      where: { id },
    });
    return fila ? this.aDominio(fila) : null;
  }

  async obtenerTodos(incluirInactivos: boolean): Promise<Proveedor[]> {
    const filas = await this.prisma.proveedor.findMany({
      where: incluirInactivos ? {} : { activo: true },
      orderBy: { nombre: 'asc' },
    });
    return filas.map((fila) => this.aDominio(fila));
  }

  async guardar(proveedor: Proveedor, ctx?: ContextoTransaccion): Promise<void> {
    const datos = {
      nombre: proveedor.nombre,
      telefono: proveedor.telefono,
      saldoAdeudado: proveedor.saldoAdeudado,
      activo: proveedor.activo,
      fechaCreacion: proveedor.fechaCreacion,
    };
    await clienteDeContexto(this.prisma, ctx).proveedor.upsert({
      where: { id: proveedor.id },
      create: { id: proveedor.id, ...datos },
      update: datos,
    });
  }

  async agregarMovimiento(
    movimiento: MovimientoProveedor,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    await clienteDeContexto(this.prisma, ctx).movimientoProveedor.create({
      data: {
        id: movimiento.id,
        proveedorId: movimiento.proveedorId,
        tipo: movimiento.tipo,
        monto: movimiento.monto,
        fecha: movimiento.fecha,
        compraId: movimiento.compraId,
        gastoId: movimiento.gastoId,
        observaciones: movimiento.observaciones,
      },
    });
  }

  async obtenerMovimientos(
    proveedorId: string,
  ): Promise<MovimientoProveedor[]> {
    const filas = await this.prisma.movimientoProveedor.findMany({
      where: { proveedorId },
      orderBy: { fecha: 'desc' },
    });
    return filas.map((fila) => this.movimientoADominio(fila));
  }

  async eliminarMovimientosDeCompra(
    compraId: string,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    await clienteDeContexto(this.prisma, ctx).movimientoProveedor.deleteMany({
      where: { compraId },
    });
  }

  async eliminarMovimientosDeGasto(
    gastoId: string,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    await clienteDeContexto(this.prisma, ctx).movimientoProveedor.deleteMany({
      where: { gastoId },
    });
  }

  async tieneHistorial(proveedorId: string): Promise<boolean> {
    const movimientos = await this.prisma.movimientoProveedor.count({
      where: { proveedorId },
    });
    if (movimientos > 0) return true;
    const compras = await this.prisma.compra.count({ where: { proveedorId } });
    if (compras > 0) return true;
    const gastos = await this.prisma.gasto.count({ where: { proveedorId } });
    return gastos > 0;
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.proveedor.delete({ where: { id } });
  }

  private aDominio(fila: ProveedorPrisma): Proveedor {
    return Proveedor.reconstruir({
      id: fila.id,
      nombre: fila.nombre,
      telefono: fila.telefono,
      saldoAdeudado: Number(fila.saldoAdeudado),
      activo: fila.activo,
      fechaCreacion: fila.fechaCreacion,
    });
  }

  private movimientoADominio(fila: MovimientoPrisma): MovimientoProveedor {
    return MovimientoProveedor.reconstruir({
      id: fila.id,
      proveedorId: fila.proveedorId,
      tipo: fila.tipo as TipoMovimiento,
      monto: Number(fila.monto),
      fecha: fila.fecha,
      compraId: fila.compraId,
      gastoId: fila.gastoId,
      observaciones: fila.observaciones,
    });
  }
}
