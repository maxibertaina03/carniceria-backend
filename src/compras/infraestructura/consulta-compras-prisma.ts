import { Injectable } from '@nestjs/common';
import {
  Compra,
  ItemCompra,
  Producto,
  Proveedor,
} from '@prisma/client';
import { redondearMoneda } from '../../comun/dominio/redondeo';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import {
  CompraDetalle,
  ConsultaCompras,
} from '../aplicacion/puertos/consulta-compras';

type FilaCompra = Compra & {
  items: (ItemCompra & { producto: Producto })[];
  proveedorCta: Proveedor | null;
};

@Injectable()
export class ConsultaComprasPrisma extends ConsultaCompras {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async obtenerTodas(): Promise<CompraDetalle[]> {
    const filas = await this.prisma.compra.findMany({
      include: {
        items: { include: { producto: true } },
        proveedorCta: true,
      },
      orderBy: { fecha: 'desc' },
    });
    return filas.map((fila) => this.aDetalle(fila));
  }

  async obtenerPorId(id: string): Promise<CompraDetalle | null> {
    const fila = await this.prisma.compra.findUnique({
      where: { id },
      include: {
        items: { include: { producto: true } },
        proveedorCta: true,
      },
    });
    return fila ? this.aDetalle(fila) : null;
  }

  private aDetalle(fila: FilaCompra): CompraDetalle {
    const total = Number(fila.total);
    const montoAdeudado = Number(fila.montoAdeudado);
    const montoPagado = redondearMoneda(total - montoAdeudado);
    const formaPago =
      montoAdeudado === 0
        ? 'CONTADO'
        : montoPagado === 0
          ? 'ADEUDADO'
          : 'MIXTO';
    return {
      id: fila.id,
      fecha: fila.fecha,
      proveedor: fila.proveedor,
      proveedorId: fila.proveedorId,
      proveedorNombre: fila.proveedorCta?.nombre ?? null,
      total,
      montoAdeudado,
      montoPagado,
      formaPago,
      observaciones: fila.observaciones,
      items: fila.items.map((item) => ({
        id: item.id,
        productoId: item.productoId,
        productoNombre: item.producto.nombre,
        unidadMedida: item.producto.unidadMedida,
        cantidad: Number(item.cantidad),
        costoUnitario: Number(item.costoUnitario),
        subtotal: Number(item.subtotal),
      })),
    };
  }
}
