import { Presentacion } from './presentacion';
import { ProductoInvalidoException } from './excepciones';

describe('Presentacion', () => {
  it('se crea con nombre, equivalencia y precio', () => {
    const p = Presentacion.crear({
      productoId: 'raviol',
      nombre: 'Docena',
      cantidadEquivalente: 0.6,
      precio: 3000,
    });
    expect(p.nombre).toBe('Docena');
    expect(p.cantidadEquivalente).toBe(0.6);
    expect(p.precio).toBe(3000);
    expect(p.activo).toBe(true);
  });

  it('la equivalencia debe ser mayor a cero', () => {
    expect(() =>
      Presentacion.crear({
        productoId: 'r',
        nombre: '½ kg',
        cantidadEquivalente: 0,
        precio: 1000,
      }),
    ).toThrow(ProductoInvalidoException);
  });

  it('el nombre no puede estar vacío', () => {
    expect(() =>
      Presentacion.crear({
        productoId: 'r',
        nombre: '  ',
        cantidadEquivalente: 1,
        precio: 1000,
      }),
    ).toThrow(ProductoInvalidoException);
  });

  it('actualizar cambia precio y equivalencia', () => {
    const p = Presentacion.crear({
      productoId: 'r',
      nombre: '1 kg',
      cantidadEquivalente: 1,
      precio: 5000,
    });
    p.actualizar({ precio: 5500, cantidadEquivalente: 1 });
    expect(p.precio).toBe(5500);
  });
});
