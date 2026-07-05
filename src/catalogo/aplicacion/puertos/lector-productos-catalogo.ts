import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';
import { UnidadMedida } from '../../../comun/dominio/unidad-medida';

// Vista mínima de un producto que el catálogo ofrece a los demás contextos
// (compras y ventas) sin exponer su entidad interna.
export interface ProductoParaOperacion {
  id: string;
  nombre: string;
  activo: boolean;
  unidadMedida: UnidadMedida;
  stockActual: number;
  costoUnitarioReferencia: number;
  precioVentaReferencia: number;
}

// Puerto de solo lectura que el contexto Catálogo ofrece a otros contextos.
export abstract class LectorProductosCatalogo {
  abstract obtenerProducto(
    id: string,
    ctx?: ContextoTransaccion,
  ): Promise<ProductoParaOperacion | null>;
}
