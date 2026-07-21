import { Injectable } from '@nestjs/common';
import { AjustadorStockProducto } from '../../catalogo/aplicacion/puertos/ajustador-stock-producto';
import { UnidadDeTrabajo } from '../../comun/aplicacion/unidad-de-trabajo';
import { LectorProductosCatalogo } from '../../catalogo/aplicacion/puertos/lector-productos-catalogo';
import {
  VentaInvalidaException,
  VentaNoEncontradaException,
} from '../dominio/excepciones';
import { RepositorioVenta } from '../dominio/repositorio-venta';
import { ItemVenta, Venta } from '../dominio/venta';
import { ConsultaVentas, VentaDetalle } from './puertos/consulta-ventas';
import { DescontadorStockProducto } from './puertos/descontador-stock-producto';
import { RegistradorDeudaCliente } from './puertos/registrador-deuda-cliente';

export interface DatosRegistrarVenta {
  clienteId?: string;
  observaciones?: string;
  fecha?: Date;
  // Cuánto queda fiado (0 o ausente = venta al contado; igual al total = todo
  // fiado; un valor intermedio = pago mixto).
  montoFiado?: number;
  items: {
    productoId: string;
    cantidad: number;
    precioUnitarioVenta: number;
  }[];
}

@Injectable()
export class ServicioVentas {
  constructor(
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly repositorio: RepositorioVenta,
    private readonly consulta: ConsultaVentas,
    private readonly lectorProductos: LectorProductosCatalogo,
    private readonly descontadorStock: DescontadorStockProducto,
    private readonly registradorDeuda: RegistradorDeudaCliente,
    private readonly ajustadorStock: AjustadorStockProducto,
  ) {}

  // Registra la venta en una única transacción: descuenta stock (se bloquea
  // si no alcanza), calcula la ganancia con el costo actual de cada producto,
  // y si hay monto fiado genera el cargo en la cuenta del cliente.
  async registrar(datos: DatosRegistrarVenta): Promise<VentaDetalle> {
    const ventaId = await this.unidadDeTrabajo.ejecutar(async (ctx) => {
      if (datos.clienteId) {
        await this.registradorDeuda.verificarClienteActivo(datos.clienteId, ctx);
      }

      const itemsDominio: ItemVenta[] = [];
      for (const item of datos.items ?? []) {
        const producto = await this.lectorProductos.obtenerProducto(
          item.productoId,
          ctx,
        );
        if (!producto) {
          throw new VentaInvalidaException(
            'Uno de los productos de la venta no existe',
          );
        }
        if (!producto.activo) {
          throw new VentaInvalidaException(
            `El producto "${producto.nombre}" está desactivado`,
          );
        }
        itemsDominio.push(
          ItemVenta.crear({
            productoId: producto.id,
            cantidad: item.cantidad,
            precioUnitarioVenta: item.precioUnitarioVenta,
            costoUnitario: producto.costoUnitarioReferencia,
            unidadMedida: producto.unidadMedida,
          }),
        );
      }

      const venta = Venta.registrar({
        clienteId: datos.clienteId,
        items: itemsDominio,
        montoFiado: datos.montoFiado,
        observaciones: datos.observaciones,
        fecha: datos.fecha,
      });

      for (const item of venta.items) {
        await this.descontadorStock.descontar(
          item.productoId,
          item.cantidad,
          ctx,
        );
      }

      await this.repositorio.guardar(venta, ctx);

      if (venta.montoFiado > 0 && venta.clienteId) {
        await this.registradorDeuda.registrarCargoPorVenta(
          venta.clienteId,
          venta.id,
          venta.montoFiado,
          venta.fecha,
          ctx,
        );
      }

      return venta.id;
    });

    return this.obtener(ventaId);
  }

  listar(): Promise<VentaDetalle[]> {
    return this.consulta.obtenerTodas();
  }

  async obtener(id: string): Promise<VentaDetalle> {
    const venta = await this.consulta.obtenerPorId(id);
    if (!venta) {
      throw new VentaNoEncontradaException(id);
    }
    return venta;
  }

  // Elimina la venta revirtiéndola: devuelve el stock de cada producto y, si
  // era fiada, revierte el cargo del cliente (bloquea si ya pagó parte).
  async eliminar(id: string): Promise<void> {
    const venta = await this.obtener(id);
    await this.unidadDeTrabajo.ejecutar(async (ctx) => {
      if (venta.montoFiado > 0 && venta.clienteId) {
        await this.registradorDeuda.revertirCargoPorVenta(
          venta.clienteId,
          venta.id,
          venta.montoFiado,
          ctx,
        );
      }
      for (const item of venta.items) {
        await this.ajustadorStock.aumentarStock(
          item.productoId,
          item.cantidad,
          ctx,
        );
      }
      await this.repositorio.eliminar(id, ctx);
    });
  }
}
