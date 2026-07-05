import { randomUUID } from 'crypto';
import { Cantidad } from '../../comun/dominio/cantidad';
import { Dinero } from '../../comun/dominio/dinero';
import { redondearMoneda } from '../../comun/dominio/redondeo';
import { UnidadMedida } from '../../comun/dominio/unidad-medida';
import { CompraInvalidaException } from './excepciones';

// Línea de una compra: qué producto se compró, cuánto y a qué costo.
export class ItemCompra {
  private constructor(
    readonly productoId: string,
    readonly cantidad: number,
    readonly costoUnitario: number,
    readonly subtotal: number,
  ) {}

  static crear(datos: {
    productoId: string;
    cantidad: number;
    costoUnitario: number;
    unidadMedida: UnidadMedida;
  }): ItemCompra {
    const cantidad = Cantidad.desde(datos.cantidad, datos.unidadMedida);
    const costo = Dinero.desde(datos.costoUnitario);
    return new ItemCompra(
      datos.productoId,
      cantidad.valor,
      costo.monto,
      costo.multiplicarPor(cantidad.valor).monto,
    );
  }
}

// Aggregate root: una compra a proveedor. Al confirmarse impacta el stock y
// el costo de referencia de cada producto (vía puerto hacia el Catálogo).
export class Compra {
  private constructor(
    readonly id: string,
    readonly fecha: Date,
    readonly proveedor: string | null,
    readonly observaciones: string | null,
    readonly items: ItemCompra[],
    readonly total: number,
  ) {}

  static registrar(datos: {
    proveedor?: string;
    observaciones?: string;
    fecha?: Date;
    items: ItemCompra[];
  }): Compra {
    if (!datos.items || datos.items.length === 0) {
      throw new CompraInvalidaException(
        'Una compra debe tener al menos un producto',
      );
    }
    const total = redondearMoneda(
      datos.items.reduce((suma, item) => suma + item.subtotal, 0),
    );
    return new Compra(
      randomUUID(),
      datos.fecha ?? new Date(),
      datos.proveedor?.trim() || null,
      datos.observaciones?.trim() || null,
      datos.items,
      total,
    );
  }
}
