import { Injectable } from '@nestjs/common';
import { UnidadDeTrabajo } from '../../comun/aplicacion/unidad-de-trabajo';
import {
  Comprobante,
  ComprobanteInvalidoException,
  ComprobanteNoEncontradoException,
  DatosItemComprobante,
  TipoComprobante,
} from '../dominio/comprobante';
import {
  ComprobanteDetalle,
  RepositorioComprobante,
} from '../dominio/repositorio-comprobante';

export interface DatosCrearComprobante {
  tipo: TipoComprobante;
  letra?: string;
  puntoVenta?: string;
  fecha?: Date;
  receptor: {
    nombre: string;
    docTipo?: string;
    docNumero?: string;
    domicilio?: string;
  };
  alicuotaIva?: number;
  items: DatosItemComprobante[];
  observaciones?: string;
  comprobanteOrigenId?: string;
}

@Injectable()
export class ServicioFacturacion {
  constructor(
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly repositorio: RepositorioComprobante,
  ) {}

  listar(tipo?: TipoComprobante): Promise<ComprobanteDetalle[]> {
    return this.repositorio.listar(tipo);
  }

  async obtener(id: string): Promise<ComprobanteDetalle> {
    const detalle = await this.repositorio.obtenerDetalle(id);
    if (!detalle) {
      throw new ComprobanteNoEncontradoException(id);
    }
    return detalle;
  }

  // Crea un comprobante asignándole el próximo número de su serie, en una
  // única transacción para que la numeración no se pise.
  async crear(datos: DatosCrearComprobante): Promise<ComprobanteDetalle> {
    const id = await this.unidadDeTrabajo.ejecutar(async (ctx) => {
      const letra = (datos.letra ?? 'X').trim().toUpperCase() || 'X';
      const puntoVenta = (datos.puntoVenta ?? '0001').trim() || '0001';

      if (datos.comprobanteOrigenId) {
        const origen = await this.repositorio.obtener(datos.comprobanteOrigenId);
        if (!origen) {
          throw new ComprobanteInvalidoException(
            'La factura de origen indicada no existe',
          );
        }
      }

      const numero = await this.repositorio.proximoNumero(
        datos.tipo,
        puntoVenta,
        letra,
        ctx,
      );
      const comprobante = Comprobante.crear({ ...datos, letra, puntoVenta, numero });
      await this.repositorio.guardar(comprobante, ctx);
      return comprobante.id;
    });
    return this.obtener(id);
  }

  async anular(id: string): Promise<ComprobanteDetalle> {
    await this.unidadDeTrabajo.ejecutar(async (ctx) => {
      const comprobante = await this.repositorio.obtener(id);
      if (!comprobante) {
        throw new ComprobanteNoEncontradoException(id);
      }
      comprobante.anular();
      await this.repositorio.actualizarEstado(id, comprobante.estado, ctx);
    });
    return this.obtener(id);
  }
}
