import { Cantidad, CantidadInvalidaException } from './cantidad';
import { Dinero, MontoInvalidoException } from './dinero';

describe('Dinero (value object)', () => {
  it('redondea a 2 decimales', () => {
    expect(Dinero.desde(10.999).monto).toBe(11);
    expect(Dinero.desde(10.994).monto).toBe(10.99);
  });

  it('rechaza montos negativos', () => {
    expect(() => Dinero.desde(-1)).toThrow(MontoInvalidoException);
  });

  it('suma y multiplica', () => {
    expect(Dinero.desde(10.5).sumar(Dinero.desde(0.25)).monto).toBe(10.75);
    expect(Dinero.desde(1500).multiplicarPor(1.5).monto).toBe(2250);
  });
});

describe('Cantidad (value object)', () => {
  it('redondea a 3 decimales y guarda la unidad', () => {
    const cantidad = Cantidad.desde(1.23456, 'KG');
    expect(cantidad.valor).toBe(1.235);
    expect(cantidad.unidad).toBe('KG');
  });

  it('rechaza cantidades cero o negativas', () => {
    expect(() => Cantidad.desde(0, 'KG')).toThrow(CantidadInvalidaException);
    expect(() => Cantidad.desde(-2, 'KG')).toThrow(CantidadInvalidaException);
  });
});
