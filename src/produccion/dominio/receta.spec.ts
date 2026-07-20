import { RecetaInvalidaException } from './excepciones';
import { Receta } from './receta';

function recetaSalame(): Receta {
  // Fórmula base: por cada 10 kg de salame → 10 kg de carne, 100 g de sal,
  // 50 g de pimienta, 10 m de tripa.
  return Receta.crear({
    productoTerminadoId: 'salame',
    rindeCantidad: 10,
    ingredientes: [
      { productoId: 'carne-salame', cantidad: 10 },
      { productoId: 'sal', cantidad: 100 },
      { productoId: 'pimienta', cantidad: 50 },
      { productoId: 'tripa', cantidad: 10 },
    ],
  });
}

describe('Receta (fórmula de producción)', () => {
  it('escala los ingredientes según lo que se quiere producir', () => {
    // Producir 30 kg (×3 sobre el rinde base de 10 kg).
    const escalado = recetaSalame().escalarIngredientes(30);
    expect(escalado).toEqual([
      { productoId: 'carne-salame', cantidad: 30 },
      { productoId: 'sal', cantidad: 300 },
      { productoId: 'pimienta', cantidad: 150 },
      { productoId: 'tripa', cantidad: 30 },
    ]);
  });

  it('escala correctamente cantidades no enteras', () => {
    const escalado = recetaSalame().escalarIngredientes(15);
    expect(escalado[1]).toEqual({ productoId: 'sal', cantidad: 150 });
    expect(escalado[0]).toEqual({ productoId: 'carne-salame', cantidad: 15 });
  });

  it('rechaza rinde cero o negativo', () => {
    expect(() =>
      Receta.crear({
        productoTerminadoId: 'salame',
        rindeCantidad: 0,
        ingredientes: [{ productoId: 'sal', cantidad: 100 }],
      }),
    ).toThrow(RecetaInvalidaException);
  });

  it('rechaza una receta sin ingredientes', () => {
    expect(() =>
      Receta.crear({
        productoTerminadoId: 'salame',
        rindeCantidad: 10,
        ingredientes: [],
      }),
    ).toThrow(RecetaInvalidaException);
  });

  it('no permite que el producto sea ingrediente de su propia receta', () => {
    expect(() =>
      Receta.crear({
        productoTerminadoId: 'salame',
        rindeCantidad: 10,
        ingredientes: [{ productoId: 'salame', cantidad: 1 }],
      }),
    ).toThrow(RecetaInvalidaException);
  });

  it('rechaza ingredientes repetidos', () => {
    expect(() =>
      Receta.crear({
        productoTerminadoId: 'salame',
        rindeCantidad: 10,
        ingredientes: [
          { productoId: 'sal', cantidad: 100 },
          { productoId: 'sal', cantidad: 50 },
        ],
      }),
    ).toThrow(RecetaInvalidaException);
  });
});
