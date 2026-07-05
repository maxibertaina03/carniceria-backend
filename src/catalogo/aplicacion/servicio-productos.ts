import { Injectable } from '@nestjs/common';
import { UnidadMedida } from '../../comun/dominio/unidad-medida';
import { Dinero } from '../../comun/dominio/dinero';
import { CategoriaProducto } from '../dominio/categoria-producto';
import {
  NombreProductoDuplicadoException,
  ProductoNoEncontradoException,
} from '../dominio/excepciones';
import { DatosNuevoProducto, Producto } from '../dominio/producto';
import { RepositorioProducto } from '../dominio/repositorio-producto';

export interface DatosActualizarProducto {
  nombre?: string;
  categoria?: CategoriaProducto;
  unidadMedida?: UnidadMedida;
  costoUnitarioReferencia?: number;
  precioVentaReferencia?: number;
  activo?: boolean;
}

@Injectable()
export class ServicioProductos {
  constructor(private readonly repositorio: RepositorioProducto) {}

  async crear(datos: DatosNuevoProducto): Promise<Producto> {
    await this.verificarNombreDisponible(datos.nombre);
    const producto = Producto.crear(datos);
    await this.repositorio.guardar(producto);
    return producto;
  }

  listar(incluirInactivos = false): Promise<Producto[]> {
    return this.repositorio.obtenerTodos(incluirInactivos);
  }

  async obtener(id: string): Promise<Producto> {
    const producto = await this.repositorio.obtenerPorId(id);
    if (!producto) {
      throw new ProductoNoEncontradoException(id);
    }
    return producto;
  }

  async actualizar(
    id: string,
    datos: DatosActualizarProducto,
  ): Promise<Producto> {
    const producto = await this.obtener(id);

    if (datos.nombre !== undefined && datos.nombre.trim() !== producto.nombre) {
      await this.verificarNombreDisponible(datos.nombre, id);
    }

    producto.actualizarDatos({
      nombre: datos.nombre,
      categoria: datos.categoria,
      unidadMedida: datos.unidadMedida,
    });
    producto.actualizarPreciosReferencia(
      datos.costoUnitarioReferencia !== undefined
        ? Dinero.desde(datos.costoUnitarioReferencia)
        : undefined,
      datos.precioVentaReferencia !== undefined
        ? Dinero.desde(datos.precioVentaReferencia)
        : undefined,
    );
    if (datos.activo === true) {
      producto.activar();
    } else if (datos.activo === false) {
      producto.desactivar();
    }

    await this.repositorio.guardar(producto);
    return producto;
  }

  async desactivar(id: string): Promise<void> {
    const producto = await this.obtener(id);
    producto.desactivar();
    await this.repositorio.guardar(producto);
  }

  // Invariante: nombre único entre productos activos.
  private async verificarNombreDisponible(
    nombre: string,
    idPropio?: string,
  ): Promise<void> {
    const existente = await this.repositorio.buscarActivoPorNombre(
      nombre?.trim() ?? '',
    );
    if (existente && existente.id !== idPropio) {
      throw new NombreProductoDuplicadoException(existente.nombre);
    }
  }
}
