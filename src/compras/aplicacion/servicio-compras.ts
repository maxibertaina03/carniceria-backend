import { Injectable } from '@nestjs/common';
import { UnidadDeTrabajo } from '../../comun/aplicacion/unidad-de-trabajo';
import { LectorProductosCatalogo } from '../../catalogo/aplicacion/puertos/lector-productos-catalogo';
import { Compra, ItemCompra } from '../dominio/compra';
import {
  CompraInvalidaException,
  CompraNoEncontradaException,
} from '../dominio/excepciones';
import { RepositorioCompra } from '../dominio/repositorio-compra';
import { ActualizadorStockProducto } from './puertos/actualizador-stock-producto';
import { CompraDetalle, ConsultaCompras } from './puertos/consulta-compras';

export interface DatosRegistrarCompra {
  proveedor?: string;
  observaciones?: string;
  fecha?: Date;
  items: { productoId: string; cantidad: number; costoUnitario: number }[];
}

@Injectable()
export class ServicioCompras {
  constructor(
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly repositorio: RepositorioCompra,
    private readonly consulta: ConsultaCompras,
    private readonly lectorProductos: LectorProductosCatalogo,
    private readonly actualizadorStock: ActualizadorStockProducto,
  ) {}

  // Registra la compra y, en la misma transacción, suma stock y actualiza
  // el costo de referencia de cada producto comprado.
  async registrar(datos: DatosRegistrarCompra): Promise<CompraDetalle> {
    const compraId = await this.unidadDeTrabajo.ejecutar(async (ctx) => {
      const itemsDominio: ItemCompra[] = [];
      for (const item of datos.items ?? []) {
        const producto = await this.lectorProductos.obtenerProducto(
          item.productoId,
          ctx,
        );
        if (!producto) {
          throw new CompraInvalidaException(
            'Uno de los productos de la compra no existe',
          );
        }
        if (!producto.activo) {
          throw new CompraInvalidaException(
            `El producto "${producto.nombre}" está desactivado`,
          );
        }
        itemsDominio.push(
          ItemCompra.crear({
            productoId: producto.id,
            cantidad: item.cantidad,
            costoUnitario: item.costoUnitario,
            unidadMedida: producto.unidadMedida,
          }),
        );
      }

      const compra = Compra.registrar({
        proveedor: datos.proveedor,
        observaciones: datos.observaciones,
        fecha: datos.fecha,
        items: itemsDominio,
      });
      await this.repositorio.guardar(compra, ctx);

      for (const item of compra.items) {
        await this.actualizadorStock.registrarIngreso(
          item.productoId,
          item.cantidad,
          item.costoUnitario,
          ctx,
        );
      }
      return compra.id;
    });

    return this.obtener(compraId);
  }

  listar(): Promise<CompraDetalle[]> {
    return this.consulta.obtenerTodas();
  }

  async obtener(id: string): Promise<CompraDetalle> {
    const compra = await this.consulta.obtenerPorId(id);
    if (!compra) {
      throw new CompraNoEncontradaException(id);
    }
    return compra;
  }
}
