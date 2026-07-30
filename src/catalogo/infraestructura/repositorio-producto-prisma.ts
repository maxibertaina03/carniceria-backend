import { Injectable } from '@nestjs/common';
import { Producto as ProductoPrisma } from '@prisma/client';
import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { clienteDeContexto } from '../../comun/infraestructura/cliente-de-contexto';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import { Producto } from '../dominio/producto';
import { RepositorioProducto } from '../dominio/repositorio-producto';
import { UnidadMedida } from '../../comun/dominio/unidad-medida';

@Injectable()
export class RepositorioProductoPrisma extends RepositorioProducto {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async obtenerPorId(
    id: string,
    ctx?: ContextoTransaccion,
  ): Promise<Producto | null> {
    const fila = await clienteDeContexto(this.prisma, ctx).producto.findUnique({
      where: { id },
    });
    return fila ? this.aDominio(fila) : null;
  }

  async obtenerTodos(incluirInactivos: boolean): Promise<Producto[]> {
    const filas = await this.prisma.producto.findMany({
      where: incluirInactivos ? {} : { activo: true },
      orderBy: { nombre: 'asc' },
    });
    return filas.map((fila) => this.aDominio(fila));
  }

  async buscarActivoPorNombre(nombre: string): Promise<Producto | null> {
    const fila = await this.prisma.producto.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' }, activo: true },
    });
    return fila ? this.aDominio(fila) : null;
  }

  async guardar(producto: Producto, ctx?: ContextoTransaccion): Promise<void> {
    const datos = {
      nombre: producto.nombre,
      categoria: producto.categoria,
      subcategoria: producto.subcategoria,
      unidadMedida: producto.unidadMedida,
      stockActual: producto.stockActual,
      costoUnitarioReferencia: producto.costoUnitarioReferencia,
      precioVentaReferencia: producto.precioVentaReferencia,
      seVende: producto.seVende,
      diasVencimiento: producto.diasVencimiento,
      imagen: producto.imagen,
      activo: producto.activo,
      fechaCreacion: producto.fechaCreacion,
    };
    await clienteDeContexto(this.prisma, ctx).producto.upsert({
      where: { id: producto.id },
      create: { id: producto.id, ...datos },
      update: datos,
    });
  }

  private aDominio(fila: ProductoPrisma): Producto {
    return Producto.reconstruir({
      id: fila.id,
      nombre: fila.nombre,
      categoria: fila.categoria,
      subcategoria: fila.subcategoria,
      unidadMedida: fila.unidadMedida as UnidadMedida,
      stockActual: Number(fila.stockActual),
      costoUnitarioReferencia: Number(fila.costoUnitarioReferencia),
      precioVentaReferencia: Number(fila.precioVentaReferencia),
      seVende: fila.seVende,
      diasVencimiento: fila.diasVencimiento,
      imagen: fila.imagen,
      activo: fila.activo,
      fechaCreacion: fila.fechaCreacion,
    });
  }
}
