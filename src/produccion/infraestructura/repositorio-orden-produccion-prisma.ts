import { Injectable } from '@nestjs/common';
import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { clienteDeContexto } from '../../comun/infraestructura/cliente-de-contexto';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import { OrdenProduccion } from '../dominio/orden-produccion';
import { RepositorioOrdenProduccion } from '../dominio/repositorios';

@Injectable()
export class RepositorioOrdenProduccionPrisma extends RepositorioOrdenProduccion {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async guardar(
    orden: OrdenProduccion,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    await clienteDeContexto(this.prisma, ctx).ordenProduccion.create({
      data: {
        id: orden.id,
        fecha: orden.fecha,
        productoTerminadoId: orden.productoTerminadoId,
        cantidadProducida: orden.cantidadProducida,
        costoTotal: orden.costoTotal,
        costoUnitario: orden.costoUnitario,
        observaciones: orden.observaciones,
        items: {
          create: orden.items.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            costoUnitario: item.costoUnitario,
            subtotal: item.subtotal,
          })),
        },
      },
    });
  }

  async eliminar(id: string, ctx?: ContextoTransaccion): Promise<void> {
    // Los items_produccion se borran por onDelete: Cascade.
    await clienteDeContexto(this.prisma, ctx).ordenProduccion.delete({
      where: { id },
    });
  }
}
