import { Injectable } from '@nestjs/common';
import { Presentacion as PresentacionPrisma } from '@prisma/client';
import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { clienteDeContexto } from '../../comun/infraestructura/cliente-de-contexto';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import { Presentacion } from '../dominio/presentacion';
import { RepositorioPresentacion } from '../dominio/repositorio-presentacion';

@Injectable()
export class RepositorioPresentacionPrisma extends RepositorioPresentacion {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async guardar(
    presentacion: Presentacion,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    const datos = {
      productoId: presentacion.productoId,
      nombre: presentacion.nombre,
      cantidadEquivalente: presentacion.cantidadEquivalente,
      precio: presentacion.precio,
      activo: presentacion.activo,
    };
    await clienteDeContexto(this.prisma, ctx).presentacion.upsert({
      where: { id: presentacion.id },
      create: { id: presentacion.id, ...datos },
      update: datos,
    });
  }

  async obtenerPorId(
    id: string,
    ctx?: ContextoTransaccion,
  ): Promise<Presentacion | null> {
    const fila = await clienteDeContexto(this.prisma, ctx).presentacion.findUnique({
      where: { id },
    });
    return fila ? this.aDominio(fila) : null;
  }

  async listar(productoId?: string): Promise<Presentacion[]> {
    const filas = await this.prisma.presentacion.findMany({
      where: { activo: true, ...(productoId ? { productoId } : {}) },
      orderBy: { cantidadEquivalente: 'asc' },
    });
    return filas.map((fila) => this.aDominio(fila));
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.presentacion.delete({ where: { id } });
  }

  private aDominio(fila: PresentacionPrisma): Presentacion {
    return Presentacion.reconstruir({
      id: fila.id,
      productoId: fila.productoId,
      nombre: fila.nombre,
      cantidadEquivalente: Number(fila.cantidadEquivalente),
      precio: Number(fila.precio),
      activo: fila.activo,
    });
  }
}
