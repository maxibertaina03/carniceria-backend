import { Injectable } from '@nestjs/common';
import {
  IngredienteReceta,
  ItemProduccion,
  OrdenProduccion,
  Producto,
  Receta,
} from '@prisma/client';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import {
  ConsultasProduccion,
  OrdenProduccionDetalle,
  RecetaDetalle,
} from '../aplicacion/puertos/consultas-produccion';

type FilaReceta = Receta & {
  productoTerminado: Producto;
  ingredientes: (IngredienteReceta & { producto: Producto })[];
};

type FilaOrden = OrdenProduccion & {
  productoTerminado: Producto;
  items: (ItemProduccion & { producto: Producto })[];
};

@Injectable()
export class ConsultasProduccionPrisma extends ConsultasProduccion {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listarRecetas(): Promise<RecetaDetalle[]> {
    const filas = await this.prisma.receta.findMany({
      include: {
        productoTerminado: true,
        ingredientes: { include: { producto: true } },
      },
      orderBy: { productoTerminado: { nombre: 'asc' } },
    });
    return filas.map((fila) => this.aRecetaDetalle(fila));
  }

  async obtenerRecetaPorProducto(
    productoTerminadoId: string,
  ): Promise<RecetaDetalle | null> {
    const fila = await this.prisma.receta.findUnique({
      where: { productoTerminadoId },
      include: {
        productoTerminado: true,
        ingredientes: { include: { producto: true } },
      },
    });
    return fila ? this.aRecetaDetalle(fila) : null;
  }

  async listarOrdenes(): Promise<OrdenProduccionDetalle[]> {
    const filas = await this.prisma.ordenProduccion.findMany({
      include: {
        productoTerminado: true,
        items: { include: { producto: true } },
      },
      orderBy: { fecha: 'desc' },
    });
    return filas.map((fila) => this.aOrdenDetalle(fila));
  }

  async obtenerOrden(id: string): Promise<OrdenProduccionDetalle | null> {
    const fila = await this.prisma.ordenProduccion.findUnique({
      where: { id },
      include: {
        productoTerminado: true,
        items: { include: { producto: true } },
      },
    });
    return fila ? this.aOrdenDetalle(fila) : null;
  }

  private aRecetaDetalle(fila: FilaReceta): RecetaDetalle {
    return {
      id: fila.id,
      productoTerminadoId: fila.productoTerminadoId,
      productoTerminadoNombre: fila.productoTerminado.nombre,
      rindeCantidad: Number(fila.rindeCantidad),
      activa: fila.activa,
      ingredientes: fila.ingredientes.map((ingrediente) => ({
        productoId: ingrediente.productoId,
        productoNombre: ingrediente.producto.nombre,
        unidadMedida: ingrediente.producto.unidadMedida,
        cantidad: Number(ingrediente.cantidad),
      })),
    };
  }

  private aOrdenDetalle(fila: FilaOrden): OrdenProduccionDetalle {
    return {
      id: fila.id,
      fecha: fila.fecha,
      productoTerminadoId: fila.productoTerminadoId,
      productoTerminadoNombre: fila.productoTerminado.nombre,
      cantidadProducida: Number(fila.cantidadProducida),
      costoTotal: Number(fila.costoTotal),
      costoUnitario: Number(fila.costoUnitario),
      observaciones: fila.observaciones,
      items: fila.items.map((item) => ({
        productoId: item.productoId,
        productoNombre: item.producto.nombre,
        cantidad: Number(item.cantidad),
        costoUnitario: Number(item.costoUnitario),
        subtotal: Number(item.subtotal),
      })),
    };
  }
}
