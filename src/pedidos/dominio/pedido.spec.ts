import { PedidoInvalidoException } from './excepciones';
import { Pedido } from './pedido';

function pedidoBase() {
  return Pedido.crear({
    nombreContacto: 'Juan',
    items: [{ productoId: 'matambre', cantidad: 1, precioUnitario: 14000 }],
  });
}

describe('Pedido (aggregate root)', () => {
  it('se crea PENDIENTE y calcula el total estimado', () => {
    const pedido = pedidoBase();
    expect(pedido.estado).toBe('PENDIENTE');
    expect(pedido.total).toBe(14000);
    expect(pedido.ventaId).toBeNull();
  });

  it('rechaza un pedido sin productos', () => {
    expect(() =>
      Pedido.crear({ nombreContacto: 'Juan', items: [] }),
    ).toThrow(PedidoInvalidoException);
  });

  it('rechaza un pedido sin cliente ni nombre', () => {
    expect(() =>
      Pedido.crear({ items: [{ productoId: 'x', cantidad: 1 }] }),
    ).toThrow(PedidoInvalidoException);
  });

  it('al entregarlo queda ENTREGADO y guarda la venta', () => {
    const pedido = pedidoBase();
    pedido.marcarEntregado('venta-1');
    expect(pedido.estado).toBe('ENTREGADO');
    expect(pedido.ventaId).toBe('venta-1');
  });

  it('no se puede entregar dos veces', () => {
    const pedido = pedidoBase();
    pedido.marcarEntregado('venta-1');
    expect(() => pedido.marcarEntregado('venta-2')).toThrow(
      PedidoInvalidoException,
    );
  });

  it('no se puede cancelar ni editar un pedido ya entregado', () => {
    const pedido = pedidoBase();
    pedido.marcarEntregado('venta-1');
    expect(() => pedido.cancelar()).toThrow(PedidoInvalidoException);
    expect(() =>
      pedido.actualizarDatos({ observaciones: 'nota' }),
    ).toThrow(PedidoInvalidoException);
  });

  it('un pedido cancelado no se puede entregar', () => {
    const pedido = pedidoBase();
    pedido.cancelar();
    expect(pedido.estado).toBe('CANCELADO');
    expect(() => pedido.marcarEntregado('venta-1')).toThrow(
      PedidoInvalidoException,
    );
  });
});
