import { VentaInvalidaException } from './excepciones';
import { ItemVenta, Venta } from './venta';

function itemDePrueba(cantidad = 2, precio = 1500, costo = 1000): ItemVenta {
  return ItemVenta.crear({
    productoId: 'producto-1',
    cantidad,
    precioUnitarioVenta: precio,
    costoUnitario: costo,
    unidadMedida: 'KG',
  });
}

describe('ItemVenta', () => {
  it('calcula subtotal y ganancia de la línea', () => {
    const item = itemDePrueba(2, 1500, 1000);
    expect(item.subtotal).toBe(3000);
    expect(item.gananciaLinea).toBe(1000);
  });

  it('la ganancia puede ser negativa si se vende bajo el costo', () => {
    const item = itemDePrueba(1, 800, 1000);
    expect(item.gananciaLinea).toBe(-200);
  });
});

describe('Venta (aggregate root)', () => {
  it('rechaza ventas sin productos', () => {
    expect(() => Venta.registrar({ items: [] })).toThrow(
      VentaInvalidaException,
    );
  });

  it('venta al contado: sin monto fiado', () => {
    const venta = Venta.registrar({ items: [itemDePrueba()] });
    expect(venta.total).toBe(3000);
    expect(venta.montoContado).toBe(3000);
    expect(venta.montoFiado).toBe(0);
    expect(venta.formaPago).toBe('CONTADO');
    expect(venta.gananciaTotal).toBe(1000);
  });

  it('venta toda fiada', () => {
    const venta = Venta.registrar({
      clienteId: 'cliente-1',
      items: [itemDePrueba()],
      montoFiado: 3000,
    });
    expect(venta.formaPago).toBe('FIADO');
    expect(venta.montoContado).toBe(0);
  });

  it('pago mixto: parte contado y parte fiado', () => {
    const venta = Venta.registrar({
      clienteId: 'cliente-1',
      items: [itemDePrueba()],
      montoFiado: 1200,
    });
    expect(venta.formaPago).toBe('MIXTO');
    expect(venta.montoContado).toBe(1800);
    expect(venta.montoFiado).toBe(1200);
  });

  it('rechaza fiar sin indicar cliente', () => {
    expect(() =>
      Venta.registrar({ items: [itemDePrueba()], montoFiado: 3000 }),
    ).toThrow(VentaInvalidaException);
  });

  it('rechaza un monto fiado mayor al total', () => {
    expect(() =>
      Venta.registrar({
        clienteId: 'cliente-1',
        items: [itemDePrueba()],
        montoFiado: 3001,
      }),
    ).toThrow(VentaInvalidaException);
  });
});
