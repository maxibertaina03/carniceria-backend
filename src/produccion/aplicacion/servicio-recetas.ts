import { Injectable } from '@nestjs/common';
import { LectorProductosCatalogo } from '../../catalogo/aplicacion/puertos/lector-productos-catalogo';
import { RecetaInvalidaException } from '../dominio/excepciones';
import { Receta } from '../dominio/receta';
import { RepositorioReceta } from '../dominio/repositorios';
import {
  ConsultasProduccion,
  RecetaDetalle,
} from './puertos/consultas-produccion';

export interface DatosReceta {
  productoTerminadoId: string;
  rindeCantidad: number;
  ingredientes: { productoId: string; cantidad: number }[];
}

@Injectable()
export class ServicioRecetas {
  constructor(
    private readonly repositorio: RepositorioReceta,
    private readonly consultas: ConsultasProduccion,
    private readonly lectorProductos: LectorProductosCatalogo,
  ) {}

  listar(): Promise<RecetaDetalle[]> {
    return this.consultas.listarRecetas();
  }

  obtenerPorProducto(productoTerminadoId: string): Promise<RecetaDetalle | null> {
    return this.consultas.obtenerRecetaPorProducto(productoTerminadoId);
  }

  // Crea o reemplaza la fórmula de un producto (una receta por producto).
  async guardar(datos: DatosReceta): Promise<RecetaDetalle> {
    await this.verificarProductosExisten(datos);

    const recetaExistente = await this.repositorio.obtenerPorProducto(
      datos.productoTerminadoId,
    );
    const receta = recetaExistente
      ? recetaExistente.actualizar({
          rindeCantidad: datos.rindeCantidad,
          ingredientes: datos.ingredientes,
        })
      : Receta.crear(datos);

    await this.repositorio.guardar(receta);
    const detalle = await this.consultas.obtenerRecetaPorProducto(
      datos.productoTerminadoId,
    );
    return detalle!;
  }

  async eliminar(productoTerminadoId: string): Promise<void> {
    await this.repositorio.eliminar(productoTerminadoId);
  }

  private async verificarProductosExisten(datos: DatosReceta): Promise<void> {
    const terminado = await this.lectorProductos.obtenerProducto(
      datos.productoTerminadoId,
    );
    if (!terminado) {
      throw new RecetaInvalidaException(
        'El producto terminado de la receta no existe',
      );
    }
    for (const ingrediente of datos.ingredientes ?? []) {
      const producto = await this.lectorProductos.obtenerProducto(
        ingrediente.productoId,
      );
      if (!producto) {
        throw new RecetaInvalidaException(
          'Uno de los ingredientes de la receta no existe',
        );
      }
    }
  }
}
