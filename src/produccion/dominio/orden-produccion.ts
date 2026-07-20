import { randomUUID } from 'crypto';
import { Dinero } from '../../comun/dominio/dinero';
import { redondearMoneda } from '../../comun/dominio/redondeo';
import { ProduccionInvalidaException } from './excepciones';

// Ingrediente efectivamente consumido en una producción, con su costo
// al momento de producir (snapshot).
export class ItemProduccion {
  constructor(
    readonly productoId: string,
    readonly cantidad: number,
    readonly costoUnitario: number,
    readonly subtotal: number,
  ) {}

  static crear(
    productoId: string,
    cantidad: number,
    costoUnitario: number,
  ): ItemProduccion {
    const costo = Dinero.desde(costoUnitario);
    return new ItemProduccion(
      productoId,
      cantidad,
      costo.monto,
      costo.multiplicarPor(cantidad).monto,
    );
  }
}

// Aggregate root: una tanda de producción. Suma el producto terminado al stock
// y su costo unitario sale de sumar todos los ingredientes consumidos.
export class OrdenProduccion {
  private constructor(
    readonly id: string,
    readonly fecha: Date,
    readonly productoTerminadoId: string,
    readonly cantidadProducida: number,
    readonly costoTotal: number,
    readonly costoUnitario: number,
    readonly observaciones: string | null,
    readonly items: ItemProduccion[],
  ) {}

  static registrar(datos: {
    productoTerminadoId: string;
    cantidadProducida: number;
    items: ItemProduccion[];
    observaciones?: string;
    fecha?: Date;
  }): OrdenProduccion {
    if (!(datos.cantidadProducida > 0)) {
      throw new ProduccionInvalidaException(
        'La cantidad a producir debe ser mayor a cero',
      );
    }
    if (!datos.items || datos.items.length === 0) {
      throw new ProduccionInvalidaException(
        'La producción no tiene ingredientes para consumir',
      );
    }
    const costoTotal = redondearMoneda(
      datos.items.reduce((suma, item) => suma + item.subtotal, 0),
    );
    const costoUnitario = redondearMoneda(costoTotal / datos.cantidadProducida);

    return new OrdenProduccion(
      randomUUID(),
      datos.fecha ?? new Date(),
      datos.productoTerminadoId,
      datos.cantidadProducida,
      costoTotal,
      costoUnitario,
      datos.observaciones?.trim() || null,
      datos.items,
    );
  }
}
