import { Dinero } from '../../comun/dominio/dinero';
import { Cliente } from './cliente';
import { ClienteInvalidoException } from './excepciones';

describe('Cliente.revertirCargo (al borrar una venta fiada)', () => {
  it('baja el saldo cuando el cliente no pagó nada', () => {
    const cliente = Cliente.crear({ nombre: 'Ana' });
    cliente.registrarCargo(Dinero.desde(5000));
    cliente.revertirCargo(Dinero.desde(5000));
    expect(cliente.saldoDeudor).toBe(0);
  });

  it('permite revertir si el saldo alcanza (había otras deudas)', () => {
    const cliente = Cliente.crear({ nombre: 'Ana' });
    cliente.registrarCargo(Dinero.desde(5000));
    cliente.registrarCargo(Dinero.desde(3000)); // otra venta fiada
    cliente.revertirCargo(Dinero.desde(5000)); // borro la primera
    expect(cliente.saldoDeudor).toBe(3000);
  });

  it('bloquea si el cliente ya pagó parte y el saldo no alcanza', () => {
    const cliente = Cliente.crear({ nombre: 'Ana' });
    cliente.registrarCargo(Dinero.desde(5000));
    cliente.registrarPago(Dinero.desde(4000)); // queda debiendo 1000
    expect(() => cliente.revertirCargo(Dinero.desde(5000))).toThrow(
      ClienteInvalidoException,
    );
    expect(cliente.saldoDeudor).toBe(1000);
  });
});
