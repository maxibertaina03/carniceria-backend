import { Dinero } from '../../comun/dominio/dinero';
import {
  PagoProveedorInvalidoException,
  ProveedorInvalidoException,
} from './excepciones';
import { Proveedor } from './proveedor';

describe('Proveedor (cuentas por pagar)', () => {
  it('se crea sin deuda', () => {
    const p = Proveedor.crear({ nombre: 'Frigorífico' });
    expect(p.saldoAdeudado).toBe(0);
    expect(p.activo).toBe(true);
  });

  it('un cargo aumenta lo que le debo', () => {
    const p = Proveedor.crear({ nombre: 'Frigorífico' });
    const mov = p.registrarCargo(Dinero.desde(50000), { compraId: 'c1' });
    expect(p.saldoAdeudado).toBe(50000);
    expect(mov.tipo).toBe('CARGO');
    expect(mov.compraId).toBe('c1');
  });

  it('invariante: saldo = cargos - pagos (pagos parciales)', () => {
    const p = Proveedor.crear({ nombre: 'Frigorífico' });
    p.registrarCargo(Dinero.desde(50000));
    p.registrarCargo(Dinero.desde(30000));
    const pago = p.registrarPago(Dinero.desde(20000));
    expect(pago.tipo).toBe('PAGO');
    expect(p.saldoAdeudado).toBe(60000);
  });

  it('no se puede pagar más de lo que se debe', () => {
    const p = Proveedor.crear({ nombre: 'Frigorífico' });
    p.registrarCargo(Dinero.desde(10000));
    expect(() => p.registrarPago(Dinero.desde(10000.01))).toThrow(
      PagoProveedorInvalidoException,
    );
    expect(p.saldoAdeudado).toBe(10000);
  });

  it('revertir un cargo baja el saldo; se bloquea si ya se pagó parte', () => {
    const p = Proveedor.crear({ nombre: 'Frigorífico' });
    p.registrarCargo(Dinero.desde(10000));
    p.registrarPago(Dinero.desde(4000)); // debe 6000
    expect(() => p.revertirCargo(Dinero.desde(10000))).toThrow(
      ProveedorInvalidoException,
    );
    expect(p.saldoAdeudado).toBe(6000);
  });

  it('no se puede desactivar a un proveedor al que se le debe', () => {
    const p = Proveedor.crear({ nombre: 'Frigorífico' });
    p.registrarCargo(Dinero.desde(1000));
    expect(() => p.desactivar()).toThrow(ProveedorInvalidoException);
  });
});
