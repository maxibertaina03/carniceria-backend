import { Injectable } from '@nestjs/common';
import { LectorProductosCatalogo } from '../../catalogo/aplicacion/puertos/lector-productos-catalogo';
import { UnidadDeTrabajo } from '../../comun/aplicacion/unidad-de-trabajo';
import { ActualizadorStockProducto } from '../../compras/aplicacion/puertos/actualizador-stock-producto';
import { DescontadorStockProducto } from '../../ventas/aplicacion/puertos/descontador-stock-producto';
import { Desposte } from '../dominio/desposte';
import {
  DesposteInvalidoException,
  DesposteNoEncontradoException,
} from '../dominio/excepciones';
import { RepositorioDesposte } from '../dominio/repositorio-desposte';
import { ConsultaDespostes, DesposteDetalle } from './puertos/consulta-despostes';

export interface DatosRegistrarDesposte {
  proveedor?: string;
  pesoRes: number;
  costoTotal: number;
  observaciones?: string;
  fecha?: Date;
  cortes: { productoId: string; cantidad: number; valorReferencia: number }[];
}

@Injectable()
export class ServicioDesposte {
  constructor(
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly repositorio: RepositorioDesposte,
    private readonly consulta: ConsultaDespostes,
    private readonly lectorProductos: LectorProductosCatalogo,
    private readonly actualizadorStock: ActualizadorStockProducto,
    private readonly descontadorStock: DescontadorStockProducto,
  ) {}

  // Registra el desposte y, en la misma transacción, suma cada corte al stock
  // con el costo que le tocó del reparto de la media res.
  async registrar(datos: DatosRegistrarDesposte): Promise<DesposteDetalle> {
    const desposteId = await this.unidadDeTrabajo.ejecutar(async (ctx) => {
      // Validar que cada corte apunte a un producto existente y activo.
      for (const corte of datos.cortes ?? []) {
        const producto = await this.lectorProductos.obtenerProducto(
          corte.productoId,
          ctx,
        );
        if (!producto) {
          throw new DesposteInvalidoException(
            'Uno de los cortes apunta a un producto que no existe',
          );
        }
        if (!producto.activo) {
          throw new DesposteInvalidoException(
            `El producto "${producto.nombre}" está desactivado`,
          );
        }
      }

      const desposte = Desposte.registrar({
        proveedor: datos.proveedor,
        pesoRes: datos.pesoRes,
        costoTotal: datos.costoTotal,
        observaciones: datos.observaciones,
        fecha: datos.fecha,
        cortes: datos.cortes,
      });
      await this.repositorio.guardar(desposte, ctx);

      for (const corte of desposte.cortes) {
        await this.actualizadorStock.registrarIngreso(
          corte.productoId,
          corte.cantidad,
          corte.costoUnitario,
          ctx,
        );
      }
      return desposte.id;
    });

    return this.obtener(desposteId);
  }

  listar(): Promise<DesposteDetalle[]> {
    return this.consulta.obtenerTodos();
  }

  async obtener(id: string): Promise<DesposteDetalle> {
    const desposte = await this.consulta.obtenerPorId(id);
    if (!desposte) {
      throw new DesposteNoEncontradoException(id);
    }
    return desposte;
  }

  // Elimina el desposte revirtiendo el ingreso de cada corte al stock. Si algún
  // corte ya no tiene ese stock (se vendió/usó), el descontador bloquea.
  async eliminar(id: string): Promise<void> {
    const desposte = await this.obtener(id);
    await this.unidadDeTrabajo.ejecutar(async (ctx) => {
      for (const corte of desposte.cortes) {
        await this.descontadorStock.descontar(corte.productoId, corte.cantidad, ctx);
      }
      await this.repositorio.eliminar(id, ctx);
    });
  }
}
