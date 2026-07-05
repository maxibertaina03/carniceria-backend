import { Injectable } from '@nestjs/common';
import { Compra, ItemCompra, Producto } from '@prisma/client';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import {
  CompraDetalle,
  ConsultaCompras,
} from '../aplicacion/puertos/consulta-compras';

type FilaCompra = Compra & { items: (ItemCompra & { producto: Producto })[] };

@Injectable()
export class ConsultaComprasPrisma extends ConsultaCompras {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async obtenerTodas(): Promise<CompraDetalle[]> {
    const filas = await this.prisma.compra.findMany({
      include: { items: { include: { producto: true } } },
      orderBy: { fecha: 'desc' },
    });
    return filas.map((fila) => this.aDetalle(fila));
  }

  async obtenerPorId(id: string): Promise<CompraDetalle | null> {
    const fila = await this.prisma.compra.findUnique({
      where: { id },
      include: { items: { include: { producto: true } } },
    });
    return fila ? this.aDetalle(fila) : null;
  }

  private aDetalle(fila: FilaCompra): CompraDetalle {
    return {
      id: fila.id,
      fecha: fila.fecha,
      proveedor: fila.proveedor,
      total: Number(fila.total),
      observaciones: fila.observaciones,
      items: fila.items.map((item) => ({
        id: item.id,
        productoId: item.productoId,
        productoNombre: item.producto.nombre,
        cantidad: Number(item.cantidad),
        costoUnitario: Number(item.costoUnitario),
        subtotal: Number(item.subtotal),
      })),
    };
  }
}
