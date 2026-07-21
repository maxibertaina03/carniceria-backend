import { Injectable } from '@nestjs/common';
import { AjustadorStockProducto } from '../../catalogo/aplicacion/puertos/ajustador-stock-producto';
import { LectorProductosCatalogo } from '../../catalogo/aplicacion/puertos/lector-productos-catalogo';
import { UnidadDeTrabajo } from '../../comun/aplicacion/unidad-de-trabajo';
import { redondearMoneda } from '../../comun/dominio/redondeo';
import { RepositorioReceta } from '../dominio/repositorios';
import { RecalculadorCostos } from './puertos/recalculador-costos';

@Injectable()
export class ServicioCostosProducidos extends RecalculadorCostos {
  constructor(
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly repositorioReceta: RepositorioReceta,
    private readonly lectorProductos: LectorProductosCatalogo,
    private readonly ajustadorStock: AjustadorStockProducto,
  ) {
    super();
  }

  // Recalcula el costo de referencia de cada producto que tiene receta:
  // costo = Σ (cantidad ingrediente × costo del ingrediente) / rinde.
  // Un ingrediente puede ser otro producto con receta (cadena), por eso se
  // itera a punto fijo hasta que ningún costo cambie (datos chicos, sin ciclos).
  async recalcularTodos(): Promise<void> {
    const recetas = await this.repositorioReceta.obtenerTodas();
    if (recetas.length === 0) {
      return;
    }

    // Costo actual conocido de cada producto que aparece (terminados + insumos).
    const costos = new Map<string, number>();
    const idsReferenciados = new Set<string>();
    for (const receta of recetas) {
      idsReferenciados.add(receta.productoTerminadoId);
      for (const ingrediente of receta.ingredientes) {
        idsReferenciados.add(ingrediente.productoId);
      }
    }
    for (const productoId of idsReferenciados) {
      const producto = await this.lectorProductos.obtenerProducto(productoId);
      costos.set(productoId, producto?.costoUnitarioReferencia ?? 0);
    }

    // Iteración a punto fijo: recalcular el costo de cada terminado hasta que
    // se estabilice (una cadena de N recetas converge en a lo sumo N pasadas).
    for (let pasada = 0; pasada <= recetas.length; pasada++) {
      let huboCambio = false;
      for (const receta of recetas) {
        let total = 0;
        for (const ingrediente of receta.ingredientes) {
          total += (costos.get(ingrediente.productoId) ?? 0) * ingrediente.cantidad;
        }
        const nuevoCosto = redondearMoneda(total / receta.rindeCantidad);
        if (nuevoCosto !== costos.get(receta.productoTerminadoId)) {
          costos.set(receta.productoTerminadoId, nuevoCosto);
          huboCambio = true;
        }
      }
      if (!huboCambio) {
        break;
      }
    }

    // Persistir el costo de cada producto terminado, en una única transacción.
    await this.unidadDeTrabajo.ejecutar(async (ctx) => {
      for (const receta of recetas) {
        const costo = costos.get(receta.productoTerminadoId) ?? 0;
        const actual = await this.lectorProductos.obtenerProducto(
          receta.productoTerminadoId,
          ctx,
        );
        if (actual && actual.costoUnitarioReferencia !== costo) {
          await this.ajustadorStock.fijarCostoReferencia(
            receta.productoTerminadoId,
            costo,
            ctx,
          );
        }
      }
    });
  }
}
