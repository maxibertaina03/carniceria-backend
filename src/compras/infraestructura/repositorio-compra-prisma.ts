import { Injectable } from '@nestjs/common';
import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { clienteDeContexto } from '../../comun/infraestructura/cliente-de-contexto';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import { Compra } from '../dominio/compra';
import { RepositorioCompra } from '../dominio/repositorio-compra';

@Injectable()
export class RepositorioCompraPrisma extends RepositorioCompra {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async guardar(compra: Compra, ctx?: ContextoTransaccion): Promise<void> {
    await clienteDeContexto(this.prisma, ctx).compra.create({
      data: {
        id: compra.id,
        fecha: compra.fecha,
        proveedor: compra.proveedor,
        total: compra.total,
        observaciones: compra.observaciones,
        items: {
          create: compra.items.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            costoUnitario: item.costoUnitario,
            subtotal: item.subtotal,
          })),
        },
      },
    });
  }
}
