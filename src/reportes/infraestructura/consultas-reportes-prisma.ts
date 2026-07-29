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
  ResumenInicio,
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

  async resumenInicio(): Promise<ResumenInicio> {
    const { fecha, desde, hasta } = this.diaDeHoyArgentina();

    const ventas = await this.prisma.venta.aggregate({
      where: { fecha: { gte: desde, lte: hasta } },
      _count: { id: true },
      _sum: { total: true, montoContado: true, montoFiado: true },
    });

    const porCobrar = await this.prisma.cliente.aggregate({
      _sum: { saldoDeudor: true },
    });
    const porPagar = await this.prisma.proveedor.aggregate({
      _sum: { saldoAdeudado: true },
    });

    const pedidosPendientes = await this.prisma.pedido.count({
      where: { estado: 'PENDIENTE' },
    });

    // Boletas de gasto adeudadas y sin pagar: cuáles vencieron y cuáles vencen pronto.
    const boletas = await this.prisma.gasto.findMany({
      where: { adeudado: true, pagado: false },
      select: { monto: true, fechaVencimiento: true },
    });
    const limite = new Date(`${fecha}T00:00:00Z`);
    limite.setUTCDate(limite.getUTCDate() + 7);
    const en7dias = limite.toISOString().slice(0, 10);
    let vencidas = 0;
    let porVencer = 0;
    let totalAdeudado = 0;
    for (const boleta of boletas) {
      totalAdeudado += Number(boleta.monto);
      if (!boleta.fechaVencimiento) continue;
      const vence = boleta.fechaVencimiento.toISOString().slice(0, 10);
      if (vence < fecha) vencidas++;
      else if (vence <= en7dias) porVencer++;
    }

    // Lotes de mercadería con stock y vencimiento: cuáles vencieron y cuáles
    // vencen pronto (solo hay lotes en rubros que usan la función).
    const lotesConVenc = await this.prisma.lote.findMany({
      where: { cantidadDisponible: { gt: 0 }, fechaVencimiento: { not: null } },
      select: { fechaVencimiento: true },
    });
    let lotesVencidos = 0;
    let lotesPorVencer = 0;
    for (const lote of lotesConVenc) {
      if (!lote.fechaVencimiento) continue;
      const vence = lote.fechaVencimiento.toISOString().slice(0, 10);
      if (vence < fecha) lotesVencidos++;
      else if (vence <= en7dias) lotesPorVencer++;
    }

    return {
      fecha,
      ventasHoy: {
        cantidad: ventas._count.id,
        total: Number(ventas._sum.total ?? 0),
        contado: Number(ventas._sum.montoContado ?? 0),
        fiado: Number(ventas._sum.montoFiado ?? 0),
      },
      totalPorCobrar: redondearMoneda(Number(porCobrar._sum.saldoDeudor ?? 0)),
      totalPorPagar: redondearMoneda(Number(porPagar._sum.saldoAdeudado ?? 0)),
      pedidosPendientes,
      boletas: {
        vencidas,
        porVencer,
        totalAdeudado: redondearMoneda(totalAdeudado),
      },
      lotes: {
        vencidos: lotesVencidos,
        porVencer: lotesPorVencer,
      },
    };
  }

  // Día de hoy en hora de Argentina (UTC−3), con el rango que cubre el día
  // completo. Evita que las ventas de la tardecita cuenten como del día siguiente.
  private diaDeHoyArgentina(): { fecha: string; desde: Date; hasta: Date } {
    const art = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const y = art.getUTCFullYear();
    const m = String(art.getUTCMonth() + 1).padStart(2, '0');
    const d = String(art.getUTCDate()).padStart(2, '0');
    const fecha = `${y}-${m}-${d}`;
    return {
      fecha,
      desde: new Date(`${fecha}T00:00:00-03:00`),
      hasta: new Date(`${fecha}T23:59:59.999-03:00`),
    };
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
