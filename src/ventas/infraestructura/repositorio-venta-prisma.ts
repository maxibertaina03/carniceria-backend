import { Injectable } from '@nestjs/common';
import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { clienteDeContexto } from '../../comun/infraestructura/cliente-de-contexto';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import { RepositorioVenta } from '../dominio/repositorio-venta';
import { Venta } from '../dominio/venta';

@Injectable()
export class RepositorioVentaPrisma extends RepositorioVenta {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async guardar(venta: Venta, ctx?: ContextoTransaccion): Promise<void> {
    await clienteDeContexto(this.prisma, ctx).venta.create({
      data: {
        id: venta.id,
        fecha: venta.fecha,
        clienteId: venta.clienteId,
        total: venta.total,
        montoContado: venta.montoContado,
        montoFiado: venta.montoFiado,
        formaPago: venta.formaPago,
        observaciones: venta.observaciones,
        items: {
          create: venta.items.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitarioVenta: item.precioUnitarioVenta,
            costoUnitario: item.costoUnitario,
            subtotal: item.subtotal,
            gananciaLinea: item.gananciaLinea,
          })),
        },
      },
    });
  }
}
