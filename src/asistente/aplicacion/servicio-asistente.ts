import { Injectable } from '@nestjs/common';
import { LectorConfiguracion } from '../../configuracion/aplicacion/puertos/lector-configuracion';
import {
  ConsultasReportes,
  RangoFechas,
} from '../../reportes/aplicacion/puertos/consultas-reportes';
import { Herramienta, ProveedorIA } from './puertos/proveedor-ia';

// Servicio del asistente de soporte: responde preguntas del dueño en lenguaje
// natural usando SOLO consultas de lectura del negocio. Arma las herramientas
// (que envuelven el puerto ConsultasReportes) y una instrucción de sistema en
// español, y deja que el ProveedorIA resuelva la pregunta con ellas.
@Injectable()
export class ServicioAsistente {
  constructor(
    private readonly consultas: ConsultasReportes,
    private readonly config: LectorConfiguracion,
    private readonly ia: ProveedorIA,
  ) {}

  responder(pregunta: string): Promise<string> {
    return this.ia.responder(
      pregunta,
      this.construirHerramientas(),
      this.instruccionSistema(),
    );
  }

  // Las herramientas que el asistente puede usar. Todas son de SOLO LECTURA y
  // reutilizan el puerto ConsultasReportes (mismos datos que los reportes).
  private construirHerramientas(): Herramienta[] {
    const rangoFechas = {
      type: 'object',
      properties: {
        desde: {
          type: 'string',
          description:
            'Fecha inicial en formato AAAA-MM-DD. Si se omite, no se limita el inicio.',
        },
        hasta: {
          type: 'string',
          description:
            'Fecha final en formato AAAA-MM-DD (inclusive). Si se omite, no se limita el final.',
        },
      },
    };

    return [
      {
        nombre: 'ventas_por_periodo',
        descripcion:
          'Ventas de un período: cantidad de ventas, total vendido, ganancia bruta, ' +
          'cuánto fue en efectivo (contado) y cuánto quedó a deber (fiado), gastos del ' +
          'período y resultado final. Para "ayer", "el mes pasado" o un día puntual, ' +
          'calculá las fechas desde/hasta a partir de la fecha de hoy.',
        esquema: rangoFechas,
        ejecutar: (p) => this.consultas.ganancias(this.aRango(p)),
      },
      {
        nombre: 'productos_mas_vendidos',
        descripcion:
          'Ranking de productos más vendidos en un período, con la cantidad, el total ' +
          'vendido y la ganancia que generó cada uno. Ordenado de mayor a menor.',
        esquema: rangoFechas,
        ejecutar: (p) => this.consultas.productosMasVendidos(this.aRango(p)),
      },
      {
        nombre: 'clientes_con_deuda',
        descripcion:
          'Clientes que tienen deuda pendiente (fiado), ordenados de mayor a menor. ' +
          'Sirve para saber quién debe más y cuánto.',
        esquema: { type: 'object', properties: {} },
        ejecutar: () => this.consultas.deudas(),
      },
      {
        nombre: 'stock_productos',
        descripcion:
          'Stock actual de todos los productos activos, con su categoría, unidad de ' +
          'medida, costo y precio de referencia.',
        esquema: { type: 'object', properties: {} },
        ejecutar: () => this.consultas.stock(),
      },
      {
        nombre: 'resumen_de_hoy',
        descripcion:
          'Foto del negocio hoy: ventas del día (cantidad, total, contado y fiado), ' +
          'total por cobrar a clientes, total por pagar a proveedores, pedidos pendientes ' +
          'y boletas de gasto vencidas o por vencer.',
        esquema: { type: 'object', properties: {} },
        ejecutar: () => this.consultas.resumenInicio(),
      },
    ];
  }

  // Instrucción de sistema: contexto del negocio + reglas de la respuesta.
  private instruccionSistema(): string {
    return [
      `Sos el asistente virtual de "${this.config.nombreNegocio()}", un sistema de gestión.`,
      `La fecha de hoy es ${this.fechaDeHoy()} (zona horaria de Argentina).`,
      'Ayudás al dueño respondiendo preguntas sobre su negocio SOLO con los datos que',
      'devuelven las herramientas de consulta. No inventás números: si no tenés el dato,',
      'usá la herramienta que corresponda; si aún así no hay datos, decilo con claridad.',
      'Sos de SOLO LECTURA: no podés modificar, cargar ni borrar nada.',
      'Los montos están en pesos argentinos: mostralos con separador de miles y el signo $.',
      'Respondé siempre en español, de forma breve, clara y concreta, como para una',
      'persona que no es técnica. Si la pregunta no tiene que ver con el negocio, aclaralo',
      'amablemente.',
    ].join(' ');
  }

  // Convierte los parámetros de fecha (AAAA-MM-DD) en un rango de días completos.
  private aRango(parametros: Record<string, unknown>): RangoFechas {
    const desde = this.textoFecha(parametros?.desde);
    const hasta = this.textoFecha(parametros?.hasta);
    return {
      desde: desde ? new Date(`${desde}T00:00:00`) : undefined,
      hasta: hasta ? new Date(`${hasta}T23:59:59.999`) : undefined,
    };
  }

  private textoFecha(valor: unknown): string | undefined {
    return typeof valor === 'string' && valor.trim() ? valor.trim() : undefined;
  }

  // Fecha de hoy en Argentina, en formato AAAA-MM-DD.
  private fechaDeHoy(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date());
  }
}
