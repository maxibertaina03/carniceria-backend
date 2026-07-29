import { Lote } from './lote';

describe('Lote', () => {
  it('nace con toda su cantidad disponible', () => {
    const lote = Lote.crear({ productoId: 'p1', cantidad: 10 });
    expect(lote.cantidadInicial).toBe(10);
    expect(lote.cantidadDisponible).toBe(10);
    expect(lote.fechaVencimiento).toBeNull();
  });

  it('consumir baja lo disponible y devuelve lo tomado', () => {
    const lote = Lote.crear({ productoId: 'p1', cantidad: 10 });
    expect(lote.consumir(4)).toBe(4);
    expect(lote.cantidadDisponible).toBe(6);
  });

  it('no consume más de lo que tiene', () => {
    const lote = Lote.crear({ productoId: 'p1', cantidad: 3 });
    expect(lote.consumir(5)).toBe(3);
    expect(lote.cantidadDisponible).toBe(0);
  });
});
