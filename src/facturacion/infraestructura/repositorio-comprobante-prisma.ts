import { Injectable } from '@nestjs/common';
import {
  Comprobante as ComprobantePrisma,
  ItemComprobante as ItemPrisma,
} from '@prisma/client';
import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { clienteDeContexto } from '../../comun/infraestructura/cliente-de-contexto';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import {
  Comprobante,
  EstadoComprobante,
  ItemComprobante,
  TipoComprobante,
} from '../dominio/comprobante';
import {
  ComprobanteDetalle,
  RepositorioComprobante,
} from '../dominio/repositorio-comprobante';

type FilaConItems = ComprobantePrisma & {
  items: ItemPrisma[];
  comprobanteOrigen?: ComprobantePrisma | null;
};

function formatearNumero(
  letra: string,
  puntoVenta: string,
  numero: number,
): string {
  return `${letra} ${puntoVenta}-${String(numero).padStart(8, '0')}`;
}

@Injectable()
export class RepositorioComprobantePrisma extends RepositorioComprobante {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async guardar(
    comprobante: Comprobante,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    await clienteDeContexto(this.prisma, ctx).comprobante.create({
      data: {
        id: comprobante.id,
        tipo: comprobante.tipo,
        letra: comprobante.letra,
        puntoVenta: comprobante.puntoVenta,
        numero: comprobante.numero,
        fecha: comprobante.fecha,
        receptorNombre: comprobante.receptor.nombre,
        receptorDocTipo: comprobante.receptor.docTipo,
        receptorDocNumero: comprobante.receptor.docNumero,
        receptorDomicilio: comprobante.receptor.domicilio,
        neto: comprobante.neto,
        alicuotaIva: comprobante.alicuotaIva,
        iva: comprobante.iva,
        total: comprobante.total,
        observaciones: comprobante.observaciones,
        estado: comprobante.estado,
        comprobanteOrigenId: comprobante.comprobanteOrigenId,
        items: {
          create: comprobante.items.map((item) => ({
            id: item.id,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal,
          })),
        },
      },
    });
  }

  async proximoNumero(
    tipo: TipoComprobante,
    puntoVenta: string,
    letra: string,
    ctx?: ContextoTransaccion,
  ): Promise<number> {
    const ultimo = await clienteDeContexto(this.prisma, ctx).comprobante.findFirst({
      where: { tipo, puntoVenta, letra },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    return (ultimo?.numero ?? 0) + 1;
  }

  async obtener(id: string): Promise<Comprobante | null> {
    const fila = await this.prisma.comprobante.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!fila) return null;
    return Comprobante.reconstruir({
      id: fila.id,
      tipo: fila.tipo,
      letra: fila.letra,
      puntoVenta: fila.puntoVenta,
      numero: fila.numero,
      fecha: fila.fecha,
      receptor: {
        nombre: fila.receptorNombre,
        docTipo: fila.receptorDocTipo,
        docNumero: fila.receptorDocNumero,
        domicilio: fila.receptorDomicilio,
      },
      neto: Number(fila.neto),
      alicuotaIva: Number(fila.alicuotaIva),
      iva: Number(fila.iva),
      total: Number(fila.total),
      observaciones: fila.observaciones,
      estado: fila.estado,
      comprobanteOrigenId: fila.comprobanteOrigenId,
      items: fila.items.map((item) =>
        ItemComprobante.reconstruir({
          id: item.id,
          descripcion: item.descripcion,
          cantidad: Number(item.cantidad),
          precioUnitario: Number(item.precioUnitario),
          subtotal: Number(item.subtotal),
        }),
      ),
    });
  }

  async obtenerDetalle(id: string): Promise<ComprobanteDetalle | null> {
    const fila = await this.prisma.comprobante.findUnique({
      where: { id },
      include: { items: true, comprobanteOrigen: true },
    });
    return fila ? this.aDetalle(fila) : null;
  }

  async listar(tipo?: TipoComprobante): Promise<ComprobanteDetalle[]> {
    const filas = await this.prisma.comprobante.findMany({
      where: tipo ? { tipo } : undefined,
      include: { items: true, comprobanteOrigen: true },
      orderBy: { fecha: 'desc' },
    });
    return filas.map((fila) => this.aDetalle(fila));
  }

  async actualizarEstado(
    id: string,
    estado: EstadoComprobante,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    await clienteDeContexto(this.prisma, ctx).comprobante.update({
      where: { id },
      data: { estado },
    });
  }

  private aDetalle(fila: FilaConItems): ComprobanteDetalle {
    return {
      id: fila.id,
      tipo: fila.tipo,
      letra: fila.letra,
      puntoVenta: fila.puntoVenta,
      numero: fila.numero,
      numeroFormateado: formatearNumero(fila.letra, fila.puntoVenta, fila.numero),
      fecha: fila.fecha,
      receptorNombre: fila.receptorNombre,
      receptorDocTipo: fila.receptorDocTipo,
      receptorDocNumero: fila.receptorDocNumero,
      receptorDomicilio: fila.receptorDomicilio,
      neto: Number(fila.neto),
      alicuotaIva: Number(fila.alicuotaIva),
      iva: Number(fila.iva),
      total: Number(fila.total),
      observaciones: fila.observaciones,
      estado: fila.estado,
      comprobanteOrigenId: fila.comprobanteOrigenId,
      comprobanteOrigenNumero: fila.comprobanteOrigen
        ? formatearNumero(
            fila.comprobanteOrigen.letra,
            fila.comprobanteOrigen.puntoVenta,
            fila.comprobanteOrigen.numero,
          )
        : null,
      items: fila.items.map((item) => ({
        descripcion: item.descripcion,
        cantidad: Number(item.cantidad),
        precioUnitario: Number(item.precioUnitario),
        subtotal: Number(item.subtotal),
      })),
    };
  }
}
