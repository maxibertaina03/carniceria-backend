import { Injectable } from '@nestjs/common';
import { ProductoNoEncontradoException } from '../dominio/excepciones';
import { Presentacion } from '../dominio/presentacion';
import { RepositorioPresentacion } from '../dominio/repositorio-presentacion';
import { RepositorioProducto } from '../dominio/repositorio-producto';

export interface DatosPresentacion {
  productoId: string;
  nombre: string;
  cantidadEquivalente: number;
  precio: number;
}

@Injectable()
export class ServicioPresentaciones {
  constructor(
    private readonly repositorio: RepositorioPresentacion,
    private readonly repositorioProducto: RepositorioProducto,
  ) {}

  listar(productoId?: string): Promise<Presentacion[]> {
    return this.repositorio.listar(productoId);
  }

  async crear(datos: DatosPresentacion): Promise<Presentacion> {
    const producto = await this.repositorioProducto.obtenerPorId(datos.productoId);
    if (!producto) {
      throw new ProductoNoEncontradoException(datos.productoId);
    }
    const presentacion = Presentacion.crear(datos);
    await this.repositorio.guardar(presentacion);
    return presentacion;
  }

  async actualizar(
    id: string,
    datos: {
      nombre?: string;
      cantidadEquivalente?: number;
      precio?: number;
      activo?: boolean;
    },
  ): Promise<Presentacion> {
    const presentacion = await this.repositorio.obtenerPorId(id);
    if (!presentacion) {
      throw new ProductoNoEncontradoException(id);
    }
    presentacion.actualizar(datos);
    await this.repositorio.guardar(presentacion);
    return presentacion;
  }

  async eliminar(id: string): Promise<void> {
    await this.repositorio.eliminar(id);
  }
}
