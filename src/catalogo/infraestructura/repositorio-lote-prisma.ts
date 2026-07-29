import { Injectable } from '@nestjs/common';
import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { clienteDeContexto } from '../../comun/infraestructura/cliente-de-contexto';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import { Lote } from '../dominio/lote';
import { RepositorioLote } from '../dominio/repositorio-lote';

@Injectable()
export class RepositorioLotePrisma extends RepositorioLote {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async guardar(lote: Lote, ctx?: ContextoTransaccion): Promise<void> {
    await clienteDeContexto(this.prisma, ctx).lote.create({
      data: {
        id: lote.id,
        productoId: lote.productoId,
        fechaElaboracion: lote.fechaElaboracion,
        fechaVencimiento: lote.fechaVencimiento,
        cantidadInicial: lote.cantidadInicial,
        cantidadDisponible: lote.cantidadDisponible,
      },
    });
  }

  async disponiblesDeProducto(
    productoId: string,
    ctx?: ContextoTransaccion,
  ): Promise<Lote[]> {
    const filas = await clienteDeContexto(this.prisma, ctx).lote.findMany({
      where: { productoId, cantidadDisponible: { gt: 0 } },
      // Vence antes = se consume primero; los sin vencimiento, al final.
      orderBy: [
        { fechaVencimiento: { sort: 'asc', nulls: 'last' } },
        { fechaElaboracion: 'asc' },
      ],
    });
    return filas.map((fila) =>
      Lote.reconstruir({
        id: fila.id,
        productoId: fila.productoId,
        fechaElaboracion: fila.fechaElaboracion,
        fechaVencimiento: fila.fechaVencimiento,
        cantidadInicial: Number(fila.cantidadInicial),
        cantidadDisponible: Number(fila.cantidadDisponible),
      }),
    );
  }

  async actualizarDisponible(
    id: string,
    cantidadDisponible: number,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    await clienteDeContexto(this.prisma, ctx).lote.update({
      where: { id },
      data: { cantidadDisponible },
    });
  }
}
