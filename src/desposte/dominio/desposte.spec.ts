import { redondearMoneda } from '../../comun/dominio/redondeo';
import { Desposte } from './desposte';
import { DesposteInvalidoException } from './excepciones';

describe('Desposte (reparto de costo por valor relativo)', () => {
  it('reparte el costo de la res proporcional al valor × kg de cada corte', () => {
    // Res de 100 kg a $600.000. Dos cortes con distinto valor por kg:
    // - matambre: 10 kg a valor 3000/kg → peso ponderado 30.000
    // - carne salame: 20 kg a valor 1500/kg → peso ponderado 30.000
    // Ambos suman igual peso ponderado, así que se llevan $300.000 cada uno.
    const desposte = Desposte.registrar({
      pesoRes: 100,
      costoTotal: 600000,
      cortes: [
        { productoId: 'matambre', cantidad: 10, valorReferencia: 3000 },
        { productoId: 'carne-salame', cantidad: 20, valorReferencia: 1500 },
      ],
    });

    const matambre = desposte.cortes[0];
    const carne = desposte.cortes[1];
    expect(matambre.subtotal).toBe(300000);
    expect(carne.subtotal).toBe(300000);
    // Costo por kg: matambre $30.000/kg, carne $15.000/kg (el doble de valor → doble costo/kg)
    expect(matambre.costoUnitario).toBe(30000);
    expect(carne.costoUnitario).toBe(15000);
  });

  it('la suma de los costos asignados da exactamente el costo de la res', () => {
    // Números "feos" para forzar redondeos.
    const desposte = Desposte.registrar({
      pesoRes: 87.5,
      costoTotal: 533333.33,
      cortes: [
        { productoId: 'a', cantidad: 7.3, valorReferencia: 4100 },
        { productoId: 'b', cantidad: 12.7, valorReferencia: 2750 },
        { productoId: 'c', cantidad: 33.1, valorReferencia: 1990 },
      ],
    });
    const suma = redondearMoneda(
      desposte.cortes.reduce((total, corte) => total + corte.subtotal, 0),
    );
    expect(suma).toBe(533333.33);
  });

  it('rechaza un desposte sin cortes', () => {
    expect(() =>
      Desposte.registrar({ pesoRes: 100, costoTotal: 500000, cortes: [] }),
    ).toThrow(DesposteInvalidoException);
  });

  it('rechaza un corte sin valor de referencia', () => {
    expect(() =>
      Desposte.registrar({
        pesoRes: 100,
        costoTotal: 500000,
        cortes: [{ productoId: 'a', cantidad: 10, valorReferencia: 0 }],
      }),
    ).toThrow(DesposteInvalidoException);
  });
});
