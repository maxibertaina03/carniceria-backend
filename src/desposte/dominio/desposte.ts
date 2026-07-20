import { randomUUID } from 'crypto';
import { Cantidad } from '../../comun/dominio/cantidad';
import { Dinero } from '../../comun/dominio/dinero';
import { redondearMoneda } from '../../comun/dominio/redondeo';
import { DesposteInvalidoException } from './excepciones';

export interface DatosCorte {
  productoId: string;
  cantidad: number;
  // Valor por kg que el usuario le asigna al corte (ej. su precio de venta).
  // Sirve para repartir el costo de la res: los cortes más valiosos absorben
  // más costo por kg.
  valorReferencia: number;
}

// Corte obtenido del desposte, con el costo que se le asignó.
export class ItemDesposte {
  constructor(
    readonly productoId: string,
    readonly cantidad: number,
    readonly valorReferencia: number,
    readonly costoUnitario: number,
    readonly subtotal: number,
  ) {}
}

// Aggregate root: se compra una media res y se desarma en cortes.
// El costo total de la res se reparte entre los cortes según su valor relativo.
export class Desposte {
  private constructor(
    readonly id: string,
    readonly fecha: Date,
    readonly proveedor: string | null,
    readonly pesoRes: number,
    readonly costoTotal: number,
    readonly observaciones: string | null,
    readonly cortes: ItemDesposte[],
  ) {}

  static registrar(datos: {
    proveedor?: string;
    pesoRes: number;
    costoTotal: number;
    observaciones?: string;
    fecha?: Date;
    cortes: DatosCorte[];
  }): Desposte {
    if (!datos.cortes || datos.cortes.length === 0) {
      throw new DesposteInvalidoException(
        'El desposte debe tener al menos un corte',
      );
    }

    const pesoRes = Cantidad.desde(datos.pesoRes, 'KG').valor;
    const costoTotal = Dinero.desde(datos.costoTotal);
    if (costoTotal.esCero()) {
      throw new DesposteInvalidoException(
        'El costo de la media res debe ser mayor a cero',
      );
    }

    // Normalizo cantidades y valores validándolos, y calculo la base de reparto:
    // suma de (valor por kg × kg). El costo de cada corte es proporcional a su
    // participación en ese valor total.
    const normalizados = datos.cortes.map((corte) => {
      const cantidad = Cantidad.desde(corte.cantidad, 'KG').valor;
      const valor = Dinero.desde(corte.valorReferencia);
      if (valor.esCero()) {
        throw new DesposteInvalidoException(
          'Cada corte necesita un valor por kg mayor a cero para repartir el costo',
        );
      }
      return { productoId: corte.productoId, cantidad, valor: valor.monto };
    });
    const baseReparto = normalizados.reduce(
      (suma, c) => suma + c.valor * c.cantidad,
      0,
    );

    // Reparto proporcional. El subtotal es la asignación autoritativa; para que
    // la suma dé exactamente el costo de la res, el último corte absorbe el
    // remanente (evita descuadres de centavos por redondeo).
    const cortes: ItemDesposte[] = [];
    let acumulado = 0;
    normalizados.forEach((corte, indice) => {
      const esUltimo = indice === normalizados.length - 1;
      const subtotal = esUltimo
        ? redondearMoneda(costoTotal.monto - acumulado)
        : redondearMoneda(
            (costoTotal.monto * (corte.valor * corte.cantidad)) / baseReparto,
          );
      if (!esUltimo) {
        acumulado = redondearMoneda(acumulado + subtotal);
      }
      const costoUnitario = redondearMoneda(subtotal / corte.cantidad);
      cortes.push(
        new ItemDesposte(
          corte.productoId,
          corte.cantidad,
          corte.valor,
          costoUnitario,
          subtotal,
        ),
      );
    });

    return new Desposte(
      randomUUID(),
      datos.fecha ?? new Date(),
      datos.proveedor?.trim() || null,
      pesoRes,
      costoTotal.monto,
      datos.observaciones?.trim() || null,
      cortes,
    );
  }
}
