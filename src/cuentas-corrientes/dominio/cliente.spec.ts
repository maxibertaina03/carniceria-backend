import { Dinero } from '../../comun/dominio/dinero';
import { Cliente } from './cliente';
import {
  ClienteInvalidoException,
  PagoInvalidoException,
} from './excepciones';

describe('Cliente (aggregate root de cuentas corrientes)', () => {
  it('se crea activo y sin deuda', () => {
    const cliente = Cliente.crear({ nombre: 'Juan Pérez' });
    expect(cliente.activo).toBe(true);
    expect(cliente.saldoDeudor).toBe(0);
  });

  it('un cargo aumenta el saldo y genera el movimiento', () => {
    const cliente = Cliente.crear({ nombre: 'Juan Pérez' });
    const movimiento = cliente.registrarCargo(Dinero.desde(4500), {
      ventaId: 'venta-1',
    });
    expect(cliente.saldoDeudor).toBe(4500);
    expect(movimiento.tipo).toBe('CARGO');
    expect(movimiento.ventaId).toBe('venta-1');
  });

  it('invariante: saldo = cargos - pagos (pagos parciales)', () => {
    const cliente = Cliente.crear({ nombre: 'Juan Pérez' });
    cliente.registrarCargo(Dinero.desde(4500));
    cliente.registrarCargo(Dinero.desde(500));
    const pago = cliente.registrarPago(Dinero.desde(2000));
    expect(pago.tipo).toBe('PAGO');
    expect(cliente.saldoDeudor).toBe(3000);
  });

  it('rechaza un pago mayor a la deuda', () => {
    const cliente = Cliente.crear({ nombre: 'Juan Pérez' });
    cliente.registrarCargo(Dinero.desde(1000));
    expect(() => cliente.registrarPago(Dinero.desde(1000.01))).toThrow(
      PagoInvalidoException,
    );
    expect(cliente.saldoDeudor).toBe(1000);
  });

  it('rechaza pagos de cero', () => {
    const cliente = Cliente.crear({ nombre: 'Juan Pérez' });
    expect(() => cliente.registrarPago(Dinero.cero())).toThrow(
      PagoInvalidoException,
    );
  });

  it('no se puede fiar a un cliente desactivado', () => {
    const cliente = Cliente.crear({ nombre: 'Juan Pérez' });
    cliente.desactivar();
    expect(() => cliente.registrarCargo(Dinero.desde(100))).toThrow(
      ClienteInvalidoException,
    );
  });

  it('no se puede desactivar a un cliente con deuda', () => {
    const cliente = Cliente.crear({ nombre: 'Juan Pérez' });
    cliente.registrarCargo(Dinero.desde(100));
    expect(() => cliente.desactivar()).toThrow(ClienteInvalidoException);
  });
});
