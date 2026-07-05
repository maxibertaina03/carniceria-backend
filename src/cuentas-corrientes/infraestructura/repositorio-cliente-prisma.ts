import { Injectable } from '@nestjs/common';
import {
  Cliente as ClientePrisma,
  MovimientoCuenta as MovimientoPrisma,
} from '@prisma/client';
import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { clienteDeContexto } from '../../comun/infraestructura/cliente-de-contexto';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import { Cliente } from '../dominio/cliente';
import {
  MovimientoCuenta,
  TipoMovimiento,
} from '../dominio/movimiento-cuenta';
import { RepositorioCliente } from '../dominio/repositorio-cliente';

@Injectable()
export class RepositorioClientePrisma extends RepositorioCliente {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async obtenerPorId(
    id: string,
    ctx?: ContextoTransaccion,
  ): Promise<Cliente | null> {
    const fila = await clienteDeContexto(this.prisma, ctx).cliente.findUnique({
      where: { id },
    });
    return fila ? this.aDominio(fila) : null;
  }

  async obtenerTodos(incluirInactivos: boolean): Promise<Cliente[]> {
    const filas = await this.prisma.cliente.findMany({
      where: incluirInactivos ? {} : { activo: true },
      orderBy: { nombre: 'asc' },
    });
    return filas.map((fila) => this.aDominio(fila));
  }

  async guardar(cliente: Cliente, ctx?: ContextoTransaccion): Promise<void> {
    const datos = {
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      saldoDeudor: cliente.saldoDeudor,
      activo: cliente.activo,
      fechaCreacion: cliente.fechaCreacion,
    };
    await clienteDeContexto(this.prisma, ctx).cliente.upsert({
      where: { id: cliente.id },
      create: { id: cliente.id, ...datos },
      update: datos,
    });
  }

  async agregarMovimiento(
    movimiento: MovimientoCuenta,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    await clienteDeContexto(this.prisma, ctx).movimientoCuenta.create({
      data: {
        id: movimiento.id,
        clienteId: movimiento.clienteId,
        tipo: movimiento.tipo,
        monto: movimiento.monto,
        fecha: movimiento.fecha,
        ventaId: movimiento.ventaId,
        observaciones: movimiento.observaciones,
      },
    });
  }

  async obtenerMovimientos(clienteId: string): Promise<MovimientoCuenta[]> {
    const filas = await this.prisma.movimientoCuenta.findMany({
      where: { clienteId },
      orderBy: { fecha: 'desc' },
    });
    return filas.map((fila) => this.movimientoADominio(fila));
  }

  private aDominio(fila: ClientePrisma): Cliente {
    return Cliente.reconstruir({
      id: fila.id,
      nombre: fila.nombre,
      telefono: fila.telefono,
      saldoDeudor: Number(fila.saldoDeudor),
      activo: fila.activo,
      fechaCreacion: fila.fechaCreacion,
    });
  }

  private movimientoADominio(fila: MovimientoPrisma): MovimientoCuenta {
    return MovimientoCuenta.reconstruir({
      id: fila.id,
      clienteId: fila.clienteId,
      tipo: fila.tipo as TipoMovimiento,
      monto: Number(fila.monto),
      fecha: fila.fecha,
      ventaId: fila.ventaId,
      observaciones: fila.observaciones,
    });
  }
}
