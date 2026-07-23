import { Injectable } from '@nestjs/common';
import { UnidadDeTrabajo } from '../../comun/aplicacion/unidad-de-trabajo';
import { LectorProductosCatalogo } from '../../catalogo/aplicacion/puertos/lector-productos-catalogo';
import { RecalculadorCostos } from '../../produccion/aplicacion/puertos/recalculador-costos';
import { RegistradorDeudaProveedor } from '../../proveedores/aplicacion/puertos/registrador-deuda-proveedor';
import { DescontadorStockProducto } from '../../ventas/aplicacion/puertos/descontador-stock-producto';
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
  proveedorId?: string;
  // Cuánto queda a deber (0 = paga todo al contado; igual al total = todo a deber).
  montoAdeudado?: number;
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
    private readonly descontadorStock: DescontadorStockProducto,
    private readonly recalculador: RecalculadorCostos,
    private readonly registradorDeuda: RegistradorDeudaProveedor,
  ) {}

  // Registra la compra y, en la misma transacción, suma stock y actualiza
  // el costo de referencia de cada producto comprado.
  async registrar(datos: DatosRegistrarCompra): Promise<CompraDetalle> {
    const compraId = await this.unidadDeTrabajo.ejecutar(async (ctx) => {
      if ((datos.montoAdeudado ?? 0) > 0 && datos.proveedorId) {
        await this.registradorDeuda.verificarProveedorActivo(
          datos.proveedorId,
          ctx,
        );
      }

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
        proveedorId: datos.proveedorId,
        montoAdeudado: datos.montoAdeudado,
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

      // Si quedó algo a deber, se registra en la cuenta del proveedor.
      if (compra.montoAdeudado > 0 && compra.proveedorId) {
        await this.registradorDeuda.registrarCargoPorCompra(
          compra.proveedorId,
          compra.id,
          compra.montoAdeudado,
          compra.fecha,
          ctx,
        );
      }
      return compra.id;
    });

    // Comprar insumos cambia su costo → recalcular el costo de lo que se produce.
    await this.recalculador.recalcularTodos();
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

  // Elimina la compra revirtiendo su ingreso: descuenta del stock lo que había
  // sumado. Si algún producto ya no tiene ese stock (se vendió/usó), el
  // descontador bloquea y la eliminación se cancela entera.
  async eliminar(id: string): Promise<void> {
    const compra = await this.obtener(id);
    await this.unidadDeTrabajo.ejecutar(async (ctx) => {
      // Si la compra tenía deuda, se revierte primero (bloquea si ya se pagó parte).
      if (compra.montoAdeudado > 0 && compra.proveedorId) {
        await this.registradorDeuda.revertirCargoPorCompra(
          compra.proveedorId,
          compra.id,
          compra.montoAdeudado,
          ctx,
        );
      }
      for (const item of compra.items) {
        await this.descontadorStock.descontar(item.productoId, item.cantidad, ctx);
      }
      await this.repositorio.eliminar(id, ctx);
    });
  }
}
