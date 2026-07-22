import {
  convertirCantidad,
  sonCompatibles,
  unidadesCompatibles,
  UnidadIncompatibleException,
} from './conversion-unidades';

describe('Conversión de unidades', () => {
  it('convierte gramos a kilos', () => {
    expect(convertirCantidad(28, 'GRAMO', 'KG')).toBeCloseTo(0.028, 6);
    expect(convertirCantidad(1000, 'GRAMO', 'KG')).toBe(1);
    expect(convertirCantidad(5, 'GRAMO', 'KG')).toBeCloseTo(0.005, 6);
  });

  it('convierte kilos a gramos', () => {
    expect(convertirCantidad(0.5, 'KG', 'GRAMO')).toBe(500);
    expect(convertirCantidad(2, 'KG', 'GRAMO')).toBe(2000);
  });

  it('el costo de 28 g de una sal de $1.500 el kilo es $42', () => {
    // Este era el problema: cargar "28" contra un precio por kilo daba $42.000.
    const enKilos = convertirCantidad(28, 'GRAMO', 'KG');
    expect(enKilos * 1500).toBeCloseTo(42, 6);
  });

  it('deja igual si la unidad es la misma', () => {
    expect(convertirCantidad(3.5, 'KG', 'KG')).toBe(3.5);
    expect(convertirCantidad(10, 'METRO', 'METRO')).toBe(10);
  });

  it('rechaza convertir entre tipos distintos (peso vs longitud)', () => {
    expect(() => convertirCantidad(1, 'KG', 'METRO')).toThrow(
      UnidadIncompatibleException,
    );
    expect(sonCompatibles('KG', 'METRO')).toBe(false);
    expect(sonCompatibles('KG', 'GRAMO')).toBe(true);
  });

  it('lista las unidades en que se puede cargar un producto', () => {
    // Un producto que se compra por kilo se puede pedir en kilos o gramos.
    expect(unidadesCompatibles('KG').sort()).toEqual(['GRAMO', 'KG']);
    expect(unidadesCompatibles('METRO')).toEqual(['METRO']);
    expect(unidadesCompatibles('UNIDAD')).toEqual(['UNIDAD']);
  });
});
