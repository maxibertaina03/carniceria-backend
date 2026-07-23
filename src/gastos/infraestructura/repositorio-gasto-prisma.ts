import { Injectable } from '@nestjs/common';
import { Gasto as GastoPrisma, Proveedor } from '@prisma/client';
import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { clienteDeContexto } from '../../comun/infraestructura/cliente-de-contexto';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import { Gasto } from '../dominio/gasto';
import { GastoDetalle, RepositorioGasto } from '../dominio/repositorio-gasto';

type FilaGasto = GastoPrisma & { proveedor: Proveedor | null };

@Injectable()
export class RepositorioGastoPrisma extends RepositorioGasto {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async guardar(gasto: Gasto, ctx?: ContextoTransaccion): Promise<void> {
    await clienteDeContexto(this.prisma, ctx).gasto.create({
      data: {
        id: gasto.id,
        fecha: gasto.fecha,
        concepto: gasto.concepto,
        categoria: gasto.categoria,
        monto: gasto.monto,
        adeudado: gasto.adeudado,
        proveedorId: gasto.proveedorId,
        observaciones: gasto.observaciones,
      },
    });
  }

  async obtenerDetalle(id: string): Promise<GastoDetalle | null> {
    const fila = await this.prisma.gasto.findUnique({
      where: { id },
      include: { proveedor: true },
    });
    return fila ? this.aDetalle(fila) : null;
  }

  async listar(): Promise<GastoDetalle[]> {
    const filas = await this.prisma.gasto.findMany({
      include: { proveedor: true },
      orderBy: { fecha: 'desc' },
    });
    return filas.map((fila) => this.aDetalle(fila));
  }

  async eliminar(id: string, ctx?: ContextoTransaccion): Promise<void> {
    await clienteDeContexto(this.prisma, ctx).gasto.delete({ where: { id } });
  }

  private aDetalle(fila: FilaGasto): GastoDetalle {
    return {
      id: fila.id,
      fecha: fila.fecha,
      concepto: fila.concepto,
      categoria: fila.categoria,
      monto: Number(fila.monto),
      adeudado: fila.adeudado,
      proveedorId: fila.proveedorId,
      proveedorNombre: fila.proveedor?.nombre ?? null,
      observaciones: fila.observaciones,
    };
  }
}
