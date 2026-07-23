import { Injectable } from '@nestjs/common';
import {
  ItemPedido as ItemPedidoPrisma,
  Pedido as PedidoPrisma,
} from '@prisma/client';
import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { clienteDeContexto } from '../../comun/infraestructura/cliente-de-contexto';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import { EstadoPedido, ItemPedido, Pedido } from '../dominio/pedido';
import { RepositorioPedido } from '../dominio/repositorio-pedido';

type FilaPedido = PedidoPrisma & { items: ItemPedidoPrisma[] };

@Injectable()
export class RepositorioPedidoPrisma extends RepositorioPedido {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async obtenerPorId(
    id: string,
    ctx?: ContextoTransaccion,
  ): Promise<Pedido | null> {
    const fila = await clienteDeContexto(this.prisma, ctx).pedido.findUnique({
      where: { id },
      include: { items: true },
    });
    return fila ? this.aDominio(fila) : null;
  }

  // Crea o reemplaza el pedido (borra sus items y los vuelve a crear, así la
  // edición queda siempre consistente).
  async guardar(pedido: Pedido, ctx?: ContextoTransaccion): Promise<void> {
    const cliente = clienteDeContexto(this.prisma, ctx);
    const datos = {
      id: pedido.id,
      fecha: pedido.fecha,
      clienteId: pedido.clienteId,
      nombreContacto: pedido.nombreContacto,
      telefono: pedido.telefono,
      fechaEntrega: pedido.fechaEntrega,
      estado: pedido.estado,
      observaciones: pedido.observaciones,
      ventaId: pedido.ventaId,
    };
    const items = {
      create: pedido.items.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
      })),
    };
    await cliente.pedido.upsert({
      where: { id: pedido.id },
      create: { ...datos, items },
      update: {
        ...datos,
        items: { deleteMany: {}, ...items },
      },
    });
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.pedido.delete({ where: { id } });
  }

  private aDominio(fila: FilaPedido): Pedido {
    return Pedido.reconstruir({
      id: fila.id,
      fecha: fila.fecha,
      clienteId: fila.clienteId,
      nombreContacto: fila.nombreContacto,
      telefono: fila.telefono,
      fechaEntrega: fila.fechaEntrega,
      estado: fila.estado as EstadoPedido,
      observaciones: fila.observaciones,
      ventaId: fila.ventaId,
      items: fila.items.map((item) =>
        ItemPedido.crear({
          productoId: item.productoId,
          cantidad: Number(item.cantidad),
          precioUnitario: Number(item.precioUnitario),
        }),
      ),
    });
  }
}
