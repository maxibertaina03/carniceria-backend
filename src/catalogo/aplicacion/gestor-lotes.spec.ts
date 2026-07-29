import { FeaturesNegocio } from '../../configuracion/dominio/configuracion-negocio';
import { LectorConfiguracion } from '../../configuracion/aplicacion/puertos/lector-configuracion';
import { Lote } from '../dominio/lote';
import { Producto } from '../dominio/producto';
import { RepositorioLote } from '../dominio/repositorio-lote';
import { RepositorioProducto } from '../dominio/repositorio-producto';
import { GestorLotes } from './gestor-lotes';

class LectorFake extends LectorConfiguracion {
  constructor(private readonly conLotes: boolean) {
    super();
  }
  categoriasValidas(): string[] {
    return [];
  }
  categoriasProducibles(): string[] {
    return [];
  }
  features(): FeaturesNegocio {
    return { lotes: this.conLotes, presentaciones: false };
  }
}

// Repositorio de lotes en memoria (solo lo que usa el gestor).
class RepoLoteFake {
  lotes: Lote[] = [];
  async guardar(lote: Lote) {
    this.lotes.push(lote);
  }
  async disponiblesDeProducto(productoId: string) {
    return this.lotes
      .filter((l) => l.productoId === productoId && l.cantidadDisponible > 0)
      .sort((a, b) => {
        const av = a.fechaVencimiento?.getTime() ?? Infinity;
        const bv = b.fechaVencimiento?.getTime() ?? Infinity;
        return av - bv;
      });
  }
  async actualizarDisponible() {
    // El objeto Lote ya está mutado en memoria; nada que hacer.
  }
}

function repoProductoConDias(dias: number | null) {
  const producto = Producto.crear({
    nombre: 'Raviol',
    categoria: 'PASTAS_RELLENAS',
    diasVencimiento: dias ?? undefined,
  });
  return {
    async obtenerPorId() {
      return producto;
    },
  } as unknown as RepositorioProducto;
}

describe('GestorLotes', () => {
  it('con lotes DESACTIVADO no crea ningún lote', async () => {
    const repoLote = new RepoLoteFake();
    const gestor = new GestorLotes(
      new LectorFake(false),
      repoLote as unknown as RepositorioLote,
      repoProductoConDias(4),
    );
    expect(gestor.activo()).toBe(false);
    await gestor.registrarIngreso('p1', 10);
    expect(repoLote.lotes).toHaveLength(0);
  });

  it('con lotes ACTIVADO crea un lote con vencimiento según los días del producto', async () => {
    const repoLote = new RepoLoteFake();
    const gestor = new GestorLotes(
      new LectorFake(true),
      repoLote as unknown as RepositorioLote,
      repoProductoConDias(4),
    );
    await gestor.registrarIngreso('p1', 10);
    expect(repoLote.lotes).toHaveLength(1);
    const lote = repoLote.lotes[0];
    expect(lote.cantidadDisponible).toBe(10);
    expect(lote.fechaVencimiento).not.toBeNull();
    const dias = Math.round(
      (lote.fechaVencimiento!.getTime() - lote.fechaElaboracion.getTime()) /
        86400000,
    );
    expect(dias).toBe(4);
  });

  it('descuenta primero del lote que vence antes (FIFO por vencimiento)', async () => {
    const repoLote = new RepoLoteFake();
    const gestor = new GestorLotes(
      new LectorFake(true),
      repoLote as unknown as RepositorioLote,
      repoProductoConDias(null),
    );
    const hoy = new Date();
    const enTresDias = new Date(hoy.getTime() + 3 * 86400000);
    const enDiezDias = new Date(hoy.getTime() + 10 * 86400000);
    // Cargo primero el que vence MÁS TARDE, para probar que igual ordena.
    repoLote.lotes.push(
      Lote.crear({ productoId: 'p1', cantidad: 5, fechaVencimiento: enDiezDias }),
      Lote.crear({ productoId: 'p1', cantidad: 5, fechaVencimiento: enTresDias }),
    );
    await gestor.descontar('p1', 6);
    const porVenc = [...repoLote.lotes].sort(
      (a, b) => a.fechaVencimiento!.getTime() - b.fechaVencimiento!.getTime(),
    );
    // El que vence en 3 días queda en 0; del otro se tomó 1.
    expect(porVenc[0].cantidadDisponible).toBe(0);
    expect(porVenc[1].cantidadDisponible).toBe(4);
  });
});
