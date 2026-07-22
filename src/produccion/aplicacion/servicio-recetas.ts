import { Injectable } from '@nestjs/common';
import { LectorProductosCatalogo } from '../../catalogo/aplicacion/puertos/lector-productos-catalogo';
import { sonCompatibles } from '../../comun/dominio/conversion-unidades';
import { UnidadMedida } from '../../comun/dominio/unidad-medida';
import { RecetaInvalidaException } from '../dominio/excepciones';
import { DatosIngrediente, Receta } from '../dominio/receta';
import { RepositorioReceta } from '../dominio/repositorios';
import {
  ConsultasProduccion,
  RecetaDetalle,
} from './puertos/consultas-produccion';
import { RecalculadorCostos } from './puertos/recalculador-costos';

export interface DatosReceta {
  productoTerminadoId: string;
  rindeCantidad: number;
  // La unidad es opcional: si no viene, se usa la del propio producto.
  ingredientes: {
    productoId: string;
    cantidad: number;
    unidad?: UnidadMedida;
  }[];
}

@Injectable()
export class ServicioRecetas {
  constructor(
    private readonly repositorio: RepositorioReceta,
    private readonly consultas: ConsultasProduccion,
    private readonly lectorProductos: LectorProductosCatalogo,
    private readonly recalculador: RecalculadorCostos,
  ) {}

  listar(): Promise<RecetaDetalle[]> {
    return this.consultas.listarRecetas();
  }

  obtenerPorProducto(productoTerminadoId: string): Promise<RecetaDetalle | null> {
    return this.consultas.obtenerRecetaPorProducto(productoTerminadoId);
  }

  // Crea o reemplaza la fórmula de un producto (una receta por producto).
  async guardar(datos: DatosReceta): Promise<RecetaDetalle> {
    const ingredientes = await this.resolverIngredientes(datos);
    const datosResueltos = { ...datos, ingredientes };

    const recetaExistente = await this.repositorio.obtenerPorProducto(
      datos.productoTerminadoId,
    );
    const receta = recetaExistente
      ? recetaExistente.actualizar({
          rindeCantidad: datos.rindeCantidad,
          ingredientes,
        })
      : Receta.crear(datosResueltos);

    await this.repositorio.guardar(receta);
    // La receta define el costo del producto: recalcular al guardarla.
    await this.recalculador.recalcularTodos();
    const detalle = await this.consultas.obtenerRecetaPorProducto(
      datos.productoTerminadoId,
    );
    return detalle!;
  }

  async eliminar(productoTerminadoId: string): Promise<void> {
    await this.repositorio.eliminar(productoTerminadoId);
    await this.recalculador.recalcularTodos();
  }

  // Verifica que los productos existan y deja cada ingrediente con una unidad
  // válida: la que se pidió (si es compatible con la del producto) o, si no se
  // indicó ninguna, la del propio producto.
  private async resolverIngredientes(
    datos: DatosReceta,
  ): Promise<DatosIngrediente[]> {
    const terminado = await this.lectorProductos.obtenerProducto(
      datos.productoTerminadoId,
    );
    if (!terminado) {
      throw new RecetaInvalidaException(
        'El producto terminado de la receta no existe',
      );
    }

    const resueltos: DatosIngrediente[] = [];
    for (const ingrediente of datos.ingredientes ?? []) {
      const producto = await this.lectorProductos.obtenerProducto(
        ingrediente.productoId,
      );
      if (!producto) {
        throw new RecetaInvalidaException(
          'Uno de los ingredientes de la receta no existe',
        );
      }
      const unidad = ingrediente.unidad ?? producto.unidadMedida;
      if (!sonCompatibles(unidad, producto.unidadMedida)) {
        throw new RecetaInvalidaException(
          `"${producto.nombre}" se mide en ${producto.unidadMedida}, no se puede cargar en ${unidad}`,
        );
      }
      resueltos.push({
        productoId: ingrediente.productoId,
        cantidad: ingrediente.cantidad,
        unidad,
      });
    }
    return resueltos;
  }
}
