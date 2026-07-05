import { Injectable } from '@nestjs/common';
import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';
import { UnidadMedida } from '../../../comun/dominio/unidad-medida';
import { clienteDeContexto } from '../../../comun/infraestructura/cliente-de-contexto';
import { PrismaService } from '../../../comun/infraestructura/prisma.service';
import {
  LectorProductosCatalogo,
  ProductoParaOperacion,
} from '../../aplicacion/puertos/lector-productos-catalogo';

@Injectable()
export class LectorProductosCatalogoPrisma extends LectorProductosCatalogo {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async obtenerProducto(
    id: string,
    ctx?: ContextoTransaccion,
  ): Promise<ProductoParaOperacion | null> {
    const fila = await clienteDeContexto(this.prisma, ctx).producto.findUnique({
      where: { id },
    });
    if (!fila) {
      return null;
    }
    return {
      id: fila.id,
      nombre: fila.nombre,
      activo: fila.activo,
      unidadMedida: fila.unidadMedida as UnidadMedida,
      stockActual: Number(fila.stockActual),
      costoUnitarioReferencia: Number(fila.costoUnitarioReferencia),
      precioVentaReferencia: Number(fila.precioVentaReferencia),
    };
  }
}
