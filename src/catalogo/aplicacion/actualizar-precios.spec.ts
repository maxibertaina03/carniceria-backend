import { nuevoPrecioPorcentaje } from './servicio-productos';

describe('nuevoPrecioPorcentaje', () => {
  it('aumenta por el porcentaje', () => {
    expect(nuevoPrecioPorcentaje(1000, 10)).toBe(1100);
    expect(nuevoPrecioPorcentaje(9500, 10)).toBe(10450);
  });

  it('baja con porcentaje negativo', () => {
    expect(nuevoPrecioPorcentaje(1000, -20)).toBe(800);
  });

  it('redondea al múltiplo indicado', () => {
    // 9500 * 1.1 = 10450 -> al 100 más cercano = 10500
    expect(nuevoPrecioPorcentaje(9500, 10, 100)).toBe(10500);
    // 1234 * 1.1 = 1357.4 -> al 10 = 1360
    expect(nuevoPrecioPorcentaje(1234, 10, 10)).toBe(1360);
    // al 50: 1357.4 -> 1350
    expect(nuevoPrecioPorcentaje(1234, 10, 50)).toBe(1350);
  });

  it('sin redondeo deja 2 decimales', () => {
    expect(nuevoPrecioPorcentaje(1000, 5)).toBe(1050);
    expect(nuevoPrecioPorcentaje(333, 10)).toBe(366.3);
  });
});
