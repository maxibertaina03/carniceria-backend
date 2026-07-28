import { Comprobante, ComprobanteInvalidoException } from './comprobante';

const receptor = { nombre: 'Cliente Mayorista SA' };
const items = [{ descripcion: 'Carne', cantidad: 10, precioUnitario: 5000 }];

describe('Comprobante', () => {
  it('calcula neto, IVA y total a partir de los ítems y la alícuota', () => {
    const c = Comprobante.crear({
      tipo: 'FACTURA',
      numero: 1,
      receptor,
      alicuotaIva: 21,
      items: [
        { descripcion: 'Carne', cantidad: 10, precioUnitario: 5000 },
        { descripcion: 'Milanesa', cantidad: 5, precioUnitario: 8000 },
      ],
    });
    expect(c.neto).toBe(90000);
    expect(c.iva).toBe(18900);
    expect(c.total).toBe(108900);
    expect(c.letra).toBe('X');
    expect(c.estado).toBe('EMITIDO');
  });

  it('sin IVA (alícuota 0), el total es igual al neto', () => {
    const c = Comprobante.crear({ tipo: 'RECIBO', numero: 3, receptor, items });
    expect(c.iva).toBe(0);
    expect(c.total).toBe(c.neto);
  });

  it('una nota de crédito sin factura de origen no se permite', () => {
    expect(() =>
      Comprobante.crear({ tipo: 'NOTA_CREDITO', numero: 1, receptor, items }),
    ).toThrow(ComprobanteInvalidoException);
  });

  it('sin ítems o sin nombre de cliente, falla', () => {
    expect(() =>
      Comprobante.crear({ tipo: 'FACTURA', numero: 1, receptor, items: [] }),
    ).toThrow(ComprobanteInvalidoException);
    expect(() =>
      Comprobante.crear({ tipo: 'FACTURA', numero: 1, receptor: { nombre: '' }, items }),
    ).toThrow(ComprobanteInvalidoException);
  });

  it('anular cambia el estado; no se puede anular dos veces', () => {
    const c = Comprobante.crear({ tipo: 'FACTURA', numero: 1, receptor, items });
    c.anular();
    expect(c.estado).toBe('ANULADO');
    expect(() => c.anular()).toThrow(ComprobanteInvalidoException);
  });
});
