import { LectorConfiguracion } from '../../configuracion/aplicacion/puertos/lector-configuracion';
import { ConsultasReportes } from '../../reportes/aplicacion/puertos/consultas-reportes';
import { ServicioAsistente } from './servicio-asistente';
import { Herramienta, ProveedorIA } from './puertos/proveedor-ia';

// ProveedorIA falso: no llama a ninguna IA. Captura la pregunta, las
// herramientas y la instrucción de sistema para poder inspeccionarlas.
class ProveedorIaFalso extends ProveedorIA {
  pregunta?: string;
  herramientas: Herramienta[] = [];
  sistema?: string;

  async responder(
    pregunta: string,
    herramientas: Herramienta[],
    instruccionSistema: string,
  ): Promise<string> {
    this.pregunta = pregunta;
    this.herramientas = herramientas;
    this.sistema = instruccionSistema;
    return 'respuesta de prueba';
  }

  herramienta(nombre: string): Herramienta {
    const h = this.herramientas.find((x) => x.nombre === nombre);
    if (!h) throw new Error(`No existe la herramienta ${nombre}`);
    return h;
  }
}

describe('ServicioAsistente', () => {
  let consultas: jest.Mocked<ConsultasReportes>;
  let config: LectorConfiguracion;
  let ia: ProveedorIaFalso;
  let servicio: ServicioAsistente;

  beforeEach(() => {
    consultas = {
      ganancias: jest.fn().mockResolvedValue({ totalVendido: 100 }),
      productosMasVendidos: jest.fn().mockResolvedValue([]),
      deudas: jest.fn().mockResolvedValue([{ nombre: 'Juan', saldoDeudor: 50 }]),
      stock: jest.fn().mockResolvedValue([]),
      resumenInicio: jest.fn().mockResolvedValue({ fecha: '2026-08-05' }),
    } as unknown as jest.Mocked<ConsultasReportes>;

    config = {
      nombreNegocio: () => 'Fábrica de Pastas',
      categoriasValidas: () => [],
      categoriasProducibles: () => [],
      features: () => ({ lotes: false, presentaciones: false }),
    };

    ia = new ProveedorIaFalso();
    servicio = new ServicioAsistente(consultas, config, ia);
  });

  it('delega la pregunta al ProveedorIA con las herramientas y la instrucción', async () => {
    const respuesta = await servicio.responder('¿Cuánto vendí ayer?');

    expect(respuesta).toBe('respuesta de prueba');
    expect(ia.pregunta).toBe('¿Cuánto vendí ayer?');
    expect(ia.herramientas.map((h) => h.nombre)).toEqual(
      expect.arrayContaining([
        'ventas_por_periodo',
        'productos_mas_vendidos',
        'clientes_con_deuda',
        'stock_productos',
        'resumen_de_hoy',
      ]),
    );
  });

  it('la instrucción de sistema nombra al negocio y aclara que es de solo lectura', async () => {
    await servicio.responder('hola');

    expect(ia.sistema).toContain('Fábrica de Pastas');
    expect(ia.sistema?.toLowerCase()).toContain('solo lectura');
  });

  it('ventas_por_periodo convierte las fechas AAAA-MM-DD a un rango de días completos', async () => {
    await servicio.responder('ventas de julio');

    await ia
      .herramienta('ventas_por_periodo')
      .ejecutar({ desde: '2026-07-01', hasta: '2026-07-31' });

    expect(consultas.ganancias).toHaveBeenCalledWith({
      desde: new Date('2026-07-01T00:00:00'),
      hasta: new Date('2026-07-31T23:59:59.999'),
    });
  });

  it('clientes_con_deuda reutiliza la consulta de deudas de Reportes', async () => {
    await servicio.responder('¿quién me debe?');

    const resultado = await ia.herramienta('clientes_con_deuda').ejecutar({});

    expect(consultas.deudas).toHaveBeenCalled();
    expect(resultado).toEqual([{ nombre: 'Juan', saldoDeudor: 50 }]);
  });
});
