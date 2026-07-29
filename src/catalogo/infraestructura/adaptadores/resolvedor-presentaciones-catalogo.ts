import { Injectable } from '@nestjs/common';
import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';
import {
  PresentacionResuelta,
  ResolvedorPresentaciones,
} from '../../../ventas/aplicacion/puertos/resolvedor-presentaciones';
import { RepositorioPresentacion } from '../../dominio/repositorio-presentacion';

// Adaptador del Catálogo para el puerto que define Ventas: traduce una
// presentación a su producto base, cantidad equivalente y precio.
@Injectable()
export class ResolvedorPresentacionesCatalogo extends ResolvedorPresentaciones {
  constructor(private readonly repositorio: RepositorioPresentacion) {
    super();
  }

  async resolver(
    presentacionId: string,
    ctx?: ContextoTransaccion,
  ): Promise<PresentacionResuelta | null> {
    const presentacion = await this.repositorio.obtenerPorId(presentacionId, ctx);
    if (!presentacion) return null;
    return {
      productoId: presentacion.productoId,
      cantidadEquivalente: presentacion.cantidadEquivalente,
      precio: presentacion.precio,
    };
  }
}
