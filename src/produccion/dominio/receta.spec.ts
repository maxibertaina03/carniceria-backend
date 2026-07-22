import { RecetaInvalidaException } from './excepciones';
import { Receta } from './receta';

function recetaSalame(): Receta {
  // Fórmula base: por cada 10 kg de salame → 10 kg de carne, y las especias
  // en gramos (aunque se compren por kilo) y la tripa en metros.
  return Receta.crear({
    productoTerminadoId: 'salame',
    rindeCantidad: 10,
    ingredientes: [
      { productoId: 'carne-salame', cantidad: 10, unidad: 'KG' },
      { productoId: 'sal', cantidad: 100, unidad: 'GRAMO' },
      { productoId: 'pimienta', cantidad: 50, unidad: 'GRAMO' },
      { productoId: 'tripa', cantidad: 10, unidad: 'METRO' },
    ],
  });
}

describe('Receta (fórmula de producción)', () => {
  it('escala los ingredientes manteniendo la unidad de cada uno', () => {
    // Producir 30 kg (×3 sobre el rinde base de 10 kg).
    const escalado = recetaSalame().escalarIngredientes(30);
    expect(escalado).toEqual([
      { productoId: 'carne-salame', cantidad: 30, unidad: 'KG' },
      { productoId: 'sal', cantidad: 300, unidad: 'GRAMO' },
      { productoId: 'pimienta', cantidad: 150, unidad: 'GRAMO' },
      { productoId: 'tripa', cantidad: 30, unidad: 'METRO' },
    ]);
  });

  it('escala correctamente cantidades no enteras', () => {
    const escalado = recetaSalame().escalarIngredientes(15);
    expect(escalado[1]).toEqual({
      productoId: 'sal',
      cantidad: 150,
      unidad: 'GRAMO',
    });
    expect(escalado[0]).toEqual({
      productoId: 'carne-salame',
      cantidad: 15,
      unidad: 'KG',
    });
  });

  it('rechaza rinde cero o negativo', () => {
    expect(() =>
      Receta.crear({
        productoTerminadoId: 'salame',
        rindeCantidad: 0,
        ingredientes: [{ productoId: 'sal', cantidad: 100, unidad: 'GRAMO' }],
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
        ingredientes: [{ productoId: 'salame', cantidad: 1, unidad: 'KG' }],
      }),
    ).toThrow(RecetaInvalidaException);
  });

  it('rechaza ingredientes repetidos', () => {
    expect(() =>
      Receta.crear({
        productoTerminadoId: 'salame',
        rindeCantidad: 10,
        ingredientes: [
          { productoId: 'sal', cantidad: 100, unidad: 'GRAMO' },
          { productoId: 'sal', cantidad: 50, unidad: 'GRAMO' },
        ],
      }),
    ).toThrow(RecetaInvalidaException);
  });
});
