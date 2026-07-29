import { resolverConfiguracion } from './rubros';

describe('Configuración por rubro', () => {
  it('carnicería es el rubro por defecto (sin RUBRO o desconocido)', () => {
    for (const entrada of [undefined, '', 'no-existe', 'CARNICERIA']) {
      const c = resolverConfiguracion(entrada);
      expect(c.rubro).toBe('carniceria');
    }
  });

  it('carnicería mantiene las 8 categorías y todos los módulos, features off', () => {
    const c = resolverConfiguracion('carniceria');
    expect(c.nombreNegocio).toBe('La Carnicería');
    expect(c.categorias.map((x) => x.codigo)).toEqual([
      'VACUNO',
      'CERDO',
      'AVE',
      'CHACINADOS',
      'MILANESAS',
      'HAMBURGUESAS',
      'INSUMOS',
      'OTROS',
    ]);
    expect(c.modulos).toContain('desposte');
    expect(c.features).toEqual({ lotes: false, presentaciones: false });
    // Las producibles siguen siendo chacinados/milanesas/hamburguesas.
    expect(
      c.categorias.filter((x) => x.producible).map((x) => x.codigo),
    ).toEqual(['CHACINADOS', 'MILANESAS', 'HAMBURGUESAS']);
  });

  it('pastas oculta Desposte, trae sus categorías y activa lotes/presentaciones', () => {
    const c = resolverConfiguracion('pastas');
    expect(c.rubro).toBe('pastas');
    expect(c.modulos).not.toContain('desposte');
    expect(c.modulos).toContain('produccion');
    expect(c.categorias.map((x) => x.codigo)).toContain('PASTAS_RELLENAS');
    expect(c.categorias.some((x) => x.esInsumo)).toBe(true);
    expect(c.features).toEqual({ lotes: true, presentaciones: true });
  });
});
