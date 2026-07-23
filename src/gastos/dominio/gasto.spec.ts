import { Gasto, GastoInvalidoException } from './gasto';

describe('Gasto', () => {
  it('un gasto al contado nace pagado y sin vencimiento', () => {
    const gasto = Gasto.crear({ concepto: 'Alquiler', monto: 100000 });
    expect(gasto.adeudado).toBe(false);
    expect(gasto.pagado).toBe(true);
    expect(gasto.fechaVencimiento).toBeNull();
  });

  it('una boleta adeudada nace pendiente y guarda el vencimiento', () => {
    const vence = new Date('2026-08-10');
    const gasto = Gasto.crear({
      concepto: 'Luz',
      monto: 50000,
      adeudado: true,
      proveedorId: 'epec',
      fechaVencimiento: vence,
    });
    expect(gasto.pagado).toBe(false);
    expect(gasto.fechaVencimiento).toEqual(vence);
  });

  it('adeudado sin proveedor no se permite', () => {
    expect(() =>
      Gasto.crear({ concepto: 'Gas', monto: 30000, adeudado: true }),
    ).toThrow(GastoInvalidoException);
  });

  it('marcar pagada deja la boleta paga; no se puede pagar dos veces', () => {
    const gasto = Gasto.crear({
      concepto: 'Gas',
      monto: 30000,
      adeudado: true,
      proveedorId: 'ecogas',
    });
    gasto.marcarPagado();
    expect(gasto.pagado).toBe(true);
    expect(() => gasto.marcarPagado()).toThrow(GastoInvalidoException);
  });
});
