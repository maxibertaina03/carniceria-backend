import { Injectable } from '@nestjs/common';
import {
  IngredienteReceta as IngredientePrisma,
  Receta as RecetaPrisma,
} from '@prisma/client';
import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { clienteDeContexto } from '../../comun/infraestructura/cliente-de-contexto';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import { Receta } from '../dominio/receta';
import { RepositorioReceta } from '../dominio/repositorios';

type FilaReceta = RecetaPrisma & { ingredientes: IngredientePrisma[] };

@Injectable()
export class RepositorioRecetaPrisma extends RepositorioReceta {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async obtenerPorProducto(
    productoTerminadoId: string,
    ctx?: ContextoTransaccion,
  ): Promise<Receta | null> {
    const fila = await clienteDeContexto(this.prisma, ctx).receta.findUnique({
      where: { productoTerminadoId },
      include: { ingredientes: true },
    });
    return fila ? this.aDominio(fila) : null;
  }

  async obtenerTodas(): Promise<Receta[]> {
    const filas = await this.prisma.receta.findMany({
      include: { ingredientes: true },
    });
    return filas.map((fila) => this.aDominio(fila));
  }

  // Crea o reemplaza la receta del producto (borra ingredientes previos y
  // vuelve a crearlos, así la edición es siempre consistente).
  async guardar(receta: Receta, ctx?: ContextoTransaccion): Promise<void> {
    const cliente = clienteDeContexto(this.prisma, ctx);
    const ingredientes = {
      create: receta.ingredientes.map((ingrediente) => ({
        productoId: ingrediente.productoId,
        cantidad: ingrediente.cantidad,
      })),
    };
    await cliente.receta.upsert({
      where: { productoTerminadoId: receta.productoTerminadoId },
      create: {
        id: receta.id,
        productoTerminadoId: receta.productoTerminadoId,
        rindeCantidad: receta.rindeCantidad,
        activa: receta.activa,
        ingredientes,
      },
      update: {
        rindeCantidad: receta.rindeCantidad,
        activa: receta.activa,
        ingredientes: {
          deleteMany: {},
          ...ingredientes,
        },
      },
    });
  }

  async eliminar(productoTerminadoId: string): Promise<void> {
    await this.prisma.receta.deleteMany({ where: { productoTerminadoId } });
  }

  private aDominio(fila: FilaReceta): Receta {
    return Receta.reconstruir({
      id: fila.id,
      productoTerminadoId: fila.productoTerminadoId,
      rindeCantidad: Number(fila.rindeCantidad),
      activa: fila.activa,
      ingredientes: fila.ingredientes.map((ingrediente) => ({
        productoId: ingrediente.productoId,
        cantidad: Number(ingrediente.cantidad),
      })),
    });
  }
}
