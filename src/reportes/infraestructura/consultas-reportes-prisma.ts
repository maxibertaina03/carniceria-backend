import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { redondearCantidad, redondearMoneda } from '../../comun/dominio/redondeo';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import {
  ConsultasReportes,
  DeudaCliente,
  ProductoMasVendido,
  RangoFechas,
  ReporteGanancias,
  StockProducto,
} from '../aplicacion/puertos/consultas-reportes';

@Injectable()
export class ConsultasReportesPrisma extends ConsultasReportes {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private filtroFecha(rango: RangoFechas): Prisma.DateTimeFilter | undefined {
    if (!rango.desde && !rango.hasta) {
      return undefined;
    }
    return { gte: rango.desde, lte: rango.hasta };
  }

  async ganancias(rango: RangoFechas): Promise<ReporteGanancias> {
    const filtro = { fecha: this.filtroFecha(rango) };

    const ventas = await this.prisma.venta.aggregate({
      where: filtro,
      _count: { id: true },
      _sum: { total: true, montoContado: true, montoFiado: true },
    });
    const ganancia = await this.prisma.itemVenta.aggregate({
      where: { venta: filtro },
      _sum: { gananciaLinea: true },
    });
    const gastos = await this.prisma.gasto.aggregate({
      where: filtro,
      _sum: { monto: true },
    });

    const gananciaTotal = redondearMoneda(
      Number(ganancia._sum.gananciaLinea ?? 0),
    );
    const totalGastos = redondearMoneda(Number(gastos._sum.monto ?? 0));

    return {
      cantidadVentas: ventas._count.id,
      totalVendido: Number(ventas._sum.total ?? 0),
      gananciaTotal,
      totalContado: Number(ventas._sum.montoContado ?? 0),
      totalFiado: Number(ventas._sum.montoFiado ?? 0),
      totalGastos,
      resultado: redondearMoneda(gananciaTotal - totalGastos),
    };
  }

  async productosMasVendidos(rango: RangoFechas): Promise<ProductoMasVendido[]> {
    const grupos = await this.prisma.itemVenta.groupBy({
      by: ['productoId'],
      where: { venta: { fecha: this.filtroFecha(rango) } },
      _sum: { cantidad: true, subtotal: true, gananciaLinea: true },
      orderBy: { _sum: { cantidad: 'desc' } },
    });

    const productos = await this.prisma.producto.findMany({
      where: { id: { in: grupos.map((grupo) => grupo.productoId) } },
    });
    const porId = new Map(productos.map((producto) => [producto.id, producto]));

    return grupos.map((grupo) => {
      const producto = porId.get(grupo.productoId);
      return {
        productoId: grupo.productoId,
        nombre: producto?.nombre ?? '(producto eliminado)',
        unidadMedida: producto?.unidadMedida ?? 'KG',
        cantidadVendida: redondearCantidad(Number(grupo._sum.cantidad ?? 0)),
        totalVendido: redondearMoneda(Number(grupo._sum.subtotal ?? 0)),
        gananciaGenerada: redondearMoneda(Number(grupo._sum.gananciaLinea ?? 0)),
      };
    });
  }

  async deudas(): Promise<DeudaCliente[]> {
    const clientes = await this.prisma.cliente.findMany({
      where: { saldoDeudor: { gt: 0 } },
      orderBy: { saldoDeudor: 'desc' },
    });
    return clientes.map((cliente) => ({
      clienteId: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      saldoDeudor: Number(cliente.saldoDeudor),
    }));
  }

  async stock(): Promise<StockProducto[]> {
    const productos = await this.prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
    return productos.map((producto) => ({
      productoId: producto.id,
      nombre: producto.nombre,
      categoria: producto.categoria,
      unidadMedida: producto.unidadMedida,
      stockActual: Number(producto.stockActual),
      costoUnitarioReferencia: Number(producto.costoUnitarioReferencia),
      precioVentaReferencia: Number(producto.precioVentaReferencia),
    }));
  }
}
