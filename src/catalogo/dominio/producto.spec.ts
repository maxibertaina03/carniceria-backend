import { Cantidad } from '../../comun/dominio/cantidad';
import { Dinero } from '../../comun/dominio/dinero';
import {
  ProductoInvalidoException,
  StockInsuficienteException,
} from './excepciones';
import { Producto } from './producto';

describe('Producto (aggregate root)', () => {
  it('se crea activo, con stock 0 y KG por defecto', () => {
    const producto = Producto.crear({ nombre: 'Asado', categoria: 'VACUNO' });
    expect(producto.activo).toBe(true);
    expect(producto.stockActual).toBe(0);
    expect(producto.unidadMedida).toBe('KG');
  });

  it('se puede dar de alta con un stock inicial', () => {
    // Al empezar a usar el sistema: "de asado hoy tengo 15 kg".
    const producto = Producto.crear({
      nombre: 'Asado',
      categoria: 'VACUNO',
      stockInicial: 15,
    });
    expect(producto.stockActual).toBe(15);
  });

  it('rechaza un stock inicial negativo', () => {
    expect(() =>
      Producto.crear({ nombre: 'Asado', categoria: 'VACUNO', stockInicial: -3 }),
    ).toThrow(ProductoInvalidoException);
  });

  it('ajustar stock deja la cantidad contada (no la suma)', () => {
    const producto = Producto.crear({
      nombre: 'Asado',
      categoria: 'VACUNO',
      stockInicial: 15,
    });
    producto.ajustarStock(12.5);
    expect(producto.stockActual).toBe(12.5);
    producto.ajustarStock(0);
    expect(producto.stockActual).toBe(0);
  });

  it('no permite ajustar el stock a un valor negativo', () => {
    const producto = Producto.crear({ nombre: 'Asado', categoria: 'VACUNO' });
    expect(() => producto.ajustarStock(-1)).toThrow(ProductoInvalidoException);
  });

  it('rechaza nombres vacíos', () => {
    expect(() =>
      Producto.crear({ nombre: '   ', categoria: 'VACUNO' }),
    ).toThrow(ProductoInvalidoException);
  });

  it('aumenta y disminuye stock', () => {
    const producto = Producto.crear({ nombre: 'Asado', categoria: 'VACUNO' });
    producto.aumentarStock(Cantidad.desde(10, 'KG'));
    producto.disminuirStock(Cantidad.desde(2.5, 'KG'));
    expect(producto.stockActual).toBe(7.5);
  });

  it('invariante: el stock no puede quedar negativo', () => {
    const producto = Producto.crear({ nombre: 'Asado', categoria: 'VACUNO' });
    producto.aumentarStock(Cantidad.desde(3, 'KG'));
    expect(() => producto.disminuirStock(Cantidad.desde(3.001, 'KG'))).toThrow(
      StockInsuficienteException,
    );
    // El stock no cambió después del intento fallido.
    expect(producto.stockActual).toBe(3);
  });

  it('actualiza los precios de referencia', () => {
    const producto = Producto.crear({ nombre: 'Asado', categoria: 'VACUNO' });
    producto.actualizarPreciosReferencia(Dinero.desde(5000), Dinero.desde(7500));
    expect(producto.costoUnitarioReferencia).toBe(5000);
    expect(producto.precioVentaReferencia).toBe(7500);

    // Actualizar solo el costo no pisa el precio de venta.
    producto.actualizarPreciosReferencia(Dinero.desde(5500));
    expect(producto.costoUnitarioReferencia).toBe(5500);
    expect(producto.precioVentaReferencia).toBe(7500);
  });
});
