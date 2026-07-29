import { Injectable } from '@nestjs/common';
import { UnidadDeTrabajo } from '../../comun/aplicacion/unidad-de-trabajo';
import { UnidadMedida } from '../../comun/dominio/unidad-medida';
import { Dinero } from '../../comun/dominio/dinero';
import { LectorConfiguracion } from '../../configuracion/aplicacion/puertos/lector-configuracion';
import {
  NombreProductoDuplicadoException,
  ProductoInvalidoException,
  ProductoNoEncontradoException,
} from '../dominio/excepciones';
import { DatosNuevoProducto, Producto } from '../dominio/producto';
import { RepositorioProducto } from '../dominio/repositorio-producto';
import { GestorLotes } from './gestor-lotes';

export interface DatosActualizarProducto {
  nombre?: string;
  categoria?: string;
  subcategoria?: string;
  unidadMedida?: UnidadMedida;
  costoUnitarioReferencia?: number;
  precioVentaReferencia?: number;
  seVende?: boolean;
  diasVencimiento?: number | null;
  activo?: boolean;
}

@Injectable()
export class ServicioProductos {
  constructor(
    private readonly repositorio: RepositorioProducto,
    private readonly configuracion: LectorConfiguracion,
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly gestorLotes: GestorLotes,
  ) {}

  async crear(datos: DatosNuevoProducto): Promise<Producto> {
    this.validarCategoria(datos.categoria);
    await this.verificarNombreDisponible(datos.nombre);
    const producto = Producto.crear(datos);
    await this.repositorio.guardar(producto);
    return producto;
  }

  // La categoría válida depende del rubro (config), no de una lista fija.
  private validarCategoria(categoria: string): void {
    const validas = this.configuracion.categoriasValidas();
    if (!validas.includes(categoria)) {
      throw new ProductoInvalidoException(
        `La categoría "${categoria}" no es válida para este negocio. Opciones: ${validas.join(', ')}`,
      );
    }
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

    if (datos.categoria !== undefined) {
      this.validarCategoria(datos.categoria);
    }

    if (datos.nombre !== undefined && datos.nombre.trim() !== producto.nombre) {
      await this.verificarNombreDisponible(datos.nombre, id);
    }

    producto.actualizarDatos({
      nombre: datos.nombre,
      categoria: datos.categoria,
      subcategoria: datos.subcategoria,
      unidadMedida: datos.unidadMedida,
      seVende: datos.seVende,
      diasVencimiento: datos.diasVencimiento,
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

  // Corrige el stock dejándolo en la cantidad real contada. Si el rubro usa
  // lotes, reconcilia los lotes para que acompañen el nuevo total.
  async ajustarStock(id: string, cantidad: number): Promise<Producto> {
    return this.unidadDeTrabajo.ejecutar(async (ctx) => {
      const producto = await this.repositorio.obtenerPorId(id, ctx);
      if (!producto) {
        throw new ProductoNoEncontradoException(id);
      }
      const anterior = producto.stockActual;
      producto.ajustarStock(cantidad);
      await this.repositorio.guardar(producto, ctx);
      await this.gestorLotes.reconciliarAjuste(id, anterior, cantidad, ctx);
      return producto;
    });
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
