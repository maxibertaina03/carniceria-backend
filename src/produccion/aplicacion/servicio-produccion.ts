import { Injectable } from '@nestjs/common';
import { LectorProductosCatalogo } from '../../catalogo/aplicacion/puertos/lector-productos-catalogo';
import { UnidadDeTrabajo } from '../../comun/aplicacion/unidad-de-trabajo';
import { ActualizadorStockProducto } from '../../compras/aplicacion/puertos/actualizador-stock-producto';
import { DescontadorStockProducto } from '../../ventas/aplicacion/puertos/descontador-stock-producto';
import {
  OrdenProduccionNoEncontradaException,
  ProduccionInvalidaException,
  RecetaNoEncontradaException,
} from '../dominio/excepciones';
import { ItemProduccion, OrdenProduccion } from '../dominio/orden-produccion';
import { RepositorioOrdenProduccion, RepositorioReceta } from '../dominio/repositorios';
import {
  ConsultasProduccion,
  OrdenProduccionDetalle,
} from './puertos/consultas-produccion';

export interface DatosRegistrarProduccion {
  productoTerminadoId: string;
  cantidadProducida: number;
  observaciones?: string;
  fecha?: Date;
}

@Injectable()
export class ServicioProduccion {
  constructor(
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly repositorioOrden: RepositorioOrdenProduccion,
    private readonly repositorioReceta: RepositorioReceta,
    private readonly consultas: ConsultasProduccion,
    private readonly lectorProductos: LectorProductosCatalogo,
    private readonly descontadorStock: DescontadorStockProducto,
    private readonly actualizadorStock: ActualizadorStockProducto,
  ) {}

  // Registra una producción en una única transacción: descuenta el stock de
  // cada ingrediente (bloquea si falta), calcula el costo con el costo actual
  // de cada ingrediente, suma el producto terminado al stock y le fija su costo.
  async registrar(
    datos: DatosRegistrarProduccion,
  ): Promise<OrdenProduccionDetalle> {
    const ordenId = await this.unidadDeTrabajo.ejecutar(async (ctx) => {
      const receta = await this.repositorioReceta.obtenerPorProducto(
        datos.productoTerminadoId,
        ctx,
      );
      if (!receta) {
        throw new RecetaNoEncontradaException(
          'Este producto no tiene una receta cargada; cargá la fórmula antes de producir',
        );
      }

      const ingredientesEscalados = receta.escalarIngredientes(
        datos.cantidadProducida,
      );

      const items: ItemProduccion[] = [];
      for (const ingrediente of ingredientesEscalados) {
        const producto = await this.lectorProductos.obtenerProducto(
          ingrediente.productoId,
          ctx,
        );
        if (!producto) {
          throw new ProduccionInvalidaException(
            'Un ingrediente de la receta ya no existe',
          );
        }
        // Descontar del stock (bloquea si no alcanza) y tomar el costo actual.
        await this.descontadorStock.descontar(
          ingrediente.productoId,
          ingrediente.cantidad,
          ctx,
        );
        items.push(
          ItemProduccion.crear(
            ingrediente.productoId,
            ingrediente.cantidad,
            producto.costoUnitarioReferencia,
          ),
        );
      }

      const orden = OrdenProduccion.registrar({
        productoTerminadoId: datos.productoTerminadoId,
        cantidadProducida: datos.cantidadProducida,
        items,
        observaciones: datos.observaciones,
        fecha: datos.fecha,
      });
      await this.repositorioOrden.guardar(orden, ctx);

      // Ingresar el producto terminado al stock con su costo unitario calculado.
      await this.actualizadorStock.registrarIngreso(
        orden.productoTerminadoId,
        orden.cantidadProducida,
        orden.costoUnitario,
        ctx,
      );

      return orden.id;
    });

    return this.obtener(ordenId);
  }

  listar(): Promise<OrdenProduccionDetalle[]> {
    return this.consultas.listarOrdenes();
  }

  async obtener(id: string): Promise<OrdenProduccionDetalle> {
    const orden = await this.consultas.obtenerOrden(id);
    if (!orden) {
      throw new OrdenProduccionNoEncontradaException(id);
    }
    return orden;
  }
}
