import { Injectable } from '@nestjs/common';
import {
  Cliente,
  ItemPedido,
  Pedido,
  Producto,
} from '@prisma/client';
import { redondearMoneda } from '../../comun/dominio/redondeo';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import {
  ConsultaPedidos,
  PedidoDetalle,
} from '../aplicacion/puertos/consulta-pedidos';

type FilaPedido = Pedido & {
  cliente: Cliente | null;
  items: (ItemPedido & { producto: Producto })[];
};

@Injectable()
export class ConsultaPedidosPrisma extends ConsultaPedidos {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listar(soloPendientes: boolean): Promise<PedidoDetalle[]> {
    const filas = await this.prisma.pedido.findMany({
      where: soloPendientes ? { estado: 'PENDIENTE' } : {},
      include: { cliente: true, items: { include: { producto: true } } },
      // Pendientes primero; dentro, por fecha de entrega más próxima.
      orderBy: [{ estado: 'asc' }, { fechaEntrega: 'asc' }, { fecha: 'desc' }],
    });
    return filas.map((fila) => this.aDetalle(fila));
  }

  async obtenerPorId(id: string): Promise<PedidoDetalle | null> {
    const fila = await this.prisma.pedido.findUnique({
      where: { id },
      include: { cliente: true, items: { include: { producto: true } } },
    });
    return fila ? this.aDetalle(fila) : null;
  }

  private aDetalle(fila: FilaPedido): PedidoDetalle {
    const items = fila.items.map((item) => ({
      productoId: item.productoId,
      productoNombre: item.producto.nombre,
      unidadMedida: item.producto.unidadMedida,
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precioUnitario),
      subtotal: redondearMoneda(
        Number(item.cantidad) * Number(item.precioUnitario),
      ),
    }));
    return {
      id: fila.id,
      fecha: fila.fecha,
      clienteId: fila.clienteId,
      clienteNombre: fila.cliente?.nombre ?? null,
      nombreContacto: fila.nombreContacto,
      telefono: fila.telefono,
      fechaEntrega: fila.fechaEntrega,
      estado: fila.estado,
      observaciones: fila.observaciones,
      ventaId: fila.ventaId,
      total: redondearMoneda(items.reduce((s, i) => s + i.subtotal, 0)),
      items,
    };
  }
}
