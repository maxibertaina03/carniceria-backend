import { Injectable } from '@nestjs/common';
import { Desposte, ItemDesposte, Producto } from '@prisma/client';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import {
  ConsultaDespostes,
  DesposteDetalle,
} from '../aplicacion/puertos/consulta-despostes';

type FilaDesposte = Desposte & {
  cortes: (ItemDesposte & { producto: Producto })[];
};

@Injectable()
export class ConsultaDespostesPrisma extends ConsultaDespostes {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async obtenerTodos(): Promise<DesposteDetalle[]> {
    const filas = await this.prisma.desposte.findMany({
      include: { cortes: { include: { producto: true } } },
      orderBy: { fecha: 'desc' },
    });
    return filas.map((fila) => this.aDetalle(fila));
  }

  async obtenerPorId(id: string): Promise<DesposteDetalle | null> {
    const fila = await this.prisma.desposte.findUnique({
      where: { id },
      include: { cortes: { include: { producto: true } } },
    });
    return fila ? this.aDetalle(fila) : null;
  }

  private aDetalle(fila: FilaDesposte): DesposteDetalle {
    return {
      id: fila.id,
      fecha: fila.fecha,
      proveedor: fila.proveedor,
      pesoRes: Number(fila.pesoRes),
      costoTotal: Number(fila.costoTotal),
      observaciones: fila.observaciones,
      cortes: fila.cortes.map((corte) => ({
        id: corte.id,
        productoId: corte.productoId,
        productoNombre: corte.producto.nombre,
        unidadMedida: corte.producto.unidadMedida,
        cantidad: Number(corte.cantidad),
        valorReferencia: Number(corte.valorReferencia),
        costoUnitario: Number(corte.costoUnitario),
        subtotal: Number(corte.subtotal),
      })),
    };
  }
}
