import { Injectable } from '@nestjs/common';
import {
  Cliente,
  ItemVenta,
  Producto,
  Venta,
} from '@prisma/client';
import { redondearMoneda } from '../../comun/dominio/redondeo';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import {
  ConsultaVentas,
  VentaDetalle,
} from '../aplicacion/puertos/consulta-ventas';

type FilaVenta = Venta & {
  cliente: Cliente | null;
  items: (ItemVenta & { producto: Producto })[];
};

@Injectable()
export class ConsultaVentasPrisma extends ConsultaVentas {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async obtenerTodas(): Promise<VentaDetalle[]> {
    const filas = await this.prisma.venta.findMany({
      include: { cliente: true, items: { include: { producto: true } } },
      orderBy: { fecha: 'desc' },
    });
    return filas.map((fila) => this.aDetalle(fila));
  }

  async obtenerPorId(id: string): Promise<VentaDetalle | null> {
    const fila = await this.prisma.venta.findUnique({
      where: { id },
      include: { cliente: true, items: { include: { producto: true } } },
    });
    return fila ? this.aDetalle(fila) : null;
  }

  private aDetalle(fila: FilaVenta): VentaDetalle {
    return {
      id: fila.id,
      fecha: fila.fecha,
      clienteId: fila.clienteId,
      clienteNombre: fila.cliente?.nombre ?? null,
      total: Number(fila.total),
      montoContado: Number(fila.montoContado),
      montoFiado: Number(fila.montoFiado),
      formaPago: fila.formaPago,
      gananciaTotal: redondearMoneda(
        fila.items.reduce((suma, item) => suma + Number(item.gananciaLinea), 0),
      ),
      observaciones: fila.observaciones,
      items: fila.items.map((item) => ({
        id: item.id,
        productoId: item.productoId,
        productoNombre: item.producto.nombre,
        unidadMedida: item.producto.unidadMedida,
        cantidad: Number(item.cantidad),
        precioUnitarioVenta: Number(item.precioUnitarioVenta),
        costoUnitario: Number(item.costoUnitario),
        subtotal: Number(item.subtotal),
        gananciaLinea: Number(item.gananciaLinea),
      })),
    };
  }
}
