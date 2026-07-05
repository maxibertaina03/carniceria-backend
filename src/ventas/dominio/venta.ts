import { randomUUID } from 'crypto';
import { Cantidad } from '../../comun/dominio/cantidad';
import { Dinero } from '../../comun/dominio/dinero';
import { redondearMoneda } from '../../comun/dominio/redondeo';
import { UnidadMedida } from '../../comun/dominio/unidad-medida';
import { VentaInvalidaException } from './excepciones';

export type FormaPago = 'CONTADO' | 'FIADO' | 'MIXTO';

// Línea de una venta. Guarda el costo del producto al momento de vender
// (snapshot): la ganancia histórica no cambia si después cambia el costo.
export class ItemVenta {
  private constructor(
    readonly productoId: string,
    readonly cantidad: number,
    readonly precioUnitarioVenta: number,
    readonly costoUnitario: number,
    readonly subtotal: number,
    readonly gananciaLinea: number,
  ) {}

  static crear(datos: {
    productoId: string;
    cantidad: number;
    precioUnitarioVenta: number;
    costoUnitario: number;
    unidadMedida: UnidadMedida;
  }): ItemVenta {
    const cantidad = Cantidad.desde(datos.cantidad, datos.unidadMedida);
    const precio = Dinero.desde(datos.precioUnitarioVenta);
    const costo = Dinero.desde(datos.costoUnitario);
    return new ItemVenta(
      datos.productoId,
      cantidad.valor,
      precio.monto,
      costo.monto,
      precio.multiplicarPor(cantidad.valor).monto,
      // La ganancia puede ser negativa si se vende por debajo del costo.
      redondearMoneda((precio.monto - costo.monto) * cantidad.valor),
    );
  }
}

// Aggregate root: una venta. Puede ser al contado, fiada o mixta
// (parte se paga en el momento y parte queda en la cuenta del cliente).
export class Venta {
  private constructor(
    readonly id: string,
    readonly fecha: Date,
    readonly clienteId: string | null,
    readonly items: ItemVenta[],
    readonly total: number,
    readonly montoContado: number,
    readonly montoFiado: number,
    readonly formaPago: FormaPago,
    readonly observaciones: string | null,
  ) {}

  static registrar(datos: {
    clienteId?: string;
    items: ItemVenta[];
    montoFiado?: number;
    observaciones?: string;
    fecha?: Date;
  }): Venta {
    if (!datos.items || datos.items.length === 0) {
      throw new VentaInvalidaException(
        'Una venta debe tener al menos un producto',
      );
    }

    const total = redondearMoneda(
      datos.items.reduce((suma, item) => suma + item.subtotal, 0),
    );
    const montoFiado = redondearMoneda(datos.montoFiado ?? 0);

    if (montoFiado < 0) {
      throw new VentaInvalidaException('El monto fiado no puede ser negativo');
    }
    if (montoFiado > total) {
      throw new VentaInvalidaException(
        `El monto fiado ($${montoFiado}) no puede superar el total de la venta ($${total})`,
      );
    }
    if (montoFiado > 0 && !datos.clienteId) {
      throw new VentaInvalidaException(
        'Para vender fiado hay que indicar qué cliente es',
      );
    }

    const montoContado = redondearMoneda(total - montoFiado);
    const formaPago: FormaPago =
      montoFiado === 0 ? 'CONTADO' : montoContado === 0 ? 'FIADO' : 'MIXTO';

    return new Venta(
      randomUUID(),
      datos.fecha ?? new Date(),
      datos.clienteId ?? null,
      datos.items,
      total,
      montoContado,
      montoFiado,
      formaPago,
      datos.observaciones?.trim() || null,
    );
  }

  get gananciaTotal(): number {
    return redondearMoneda(
      this.items.reduce((suma, item) => suma + item.gananciaLinea, 0),
    );
  }
}
