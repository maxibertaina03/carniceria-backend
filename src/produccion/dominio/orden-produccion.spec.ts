import { ProduccionInvalidaException } from './excepciones';
import { ItemProduccion, OrdenProduccion } from './orden-produccion';

describe('OrdenProduccion (cálculo de costo)', () => {
  it('el costo total es la suma de los ingredientes y el unitario es por kg producido', () => {
    // Producir 30 kg de salame consumiendo: 30 kg de carne a $1500,
    // 300 g de sal a $5, 150 g de pimienta a $20, 30 m de tripa a $200.
    const items = [
      ItemProduccion.crear('carne-salame', 30, 1500), // 45.000
      ItemProduccion.crear('sal', 300, 5), // 1.500
      ItemProduccion.crear('pimienta', 150, 20), // 3.000
      ItemProduccion.crear('tripa', 30, 200), // 6.000
    ];
    const orden = OrdenProduccion.registrar({
      productoTerminadoId: 'salame',
      cantidadProducida: 30,
      items,
    });

    expect(orden.costoTotal).toBe(55500);
    expect(orden.costoUnitario).toBe(1850); // 55.500 / 30 kg
  });

  it('rechaza producir cantidad cero', () => {
    expect(() =>
      OrdenProduccion.registrar({
        productoTerminadoId: 'salame',
        cantidadProducida: 0,
        items: [ItemProduccion.crear('sal', 1, 5)],
      }),
    ).toThrow(ProduccionInvalidaException);
  });

  it('rechaza una producción sin ingredientes', () => {
    expect(() =>
      OrdenProduccion.registrar({
        productoTerminadoId: 'salame',
        cantidadProducida: 10,
        items: [],
      }),
    ).toThrow(ProduccionInvalidaException);
  });
});
