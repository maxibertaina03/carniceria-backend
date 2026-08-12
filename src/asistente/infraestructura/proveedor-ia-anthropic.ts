import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { Herramienta, ProveedorIA } from '../aplicacion/puertos/proveedor-ia';

// Modelo rápido y económico: ideal para responder consultas de negocio al toque.
const MODELO = 'claude-haiku-4-5';
// Cuántas vueltas de "usar herramienta → leer resultado" permitimos como máximo.
const MAX_PASOS = 6;

// Adaptador del puerto ProveedorIA sobre la API de Anthropic (Claude). Corre el
// ciclo de tool-use: el modelo pide una consulta, nosotros la ejecutamos (solo
// lectura) y le devolvemos el resultado, hasta que arma la respuesta final.
@Injectable()
export class ProveedorIaAnthropic extends ProveedorIA {
  private readonly logger = new Logger(ProveedorIaAnthropic.name);
  private cliente?: Anthropic;

  async responder(
    pregunta: string,
    herramientas: Herramienta[],
    instruccionSistema: string,
  ): Promise<string> {
    const cliente = this.obtenerCliente();
    const definiciones = herramientas.map((h) => ({
      name: h.nombre,
      description: h.descripcion,
      input_schema: h.esquema as Anthropic.Tool.InputSchema,
    }));

    const mensajes: Anthropic.MessageParam[] = [
      { role: 'user', content: pregunta },
    ];

    for (let paso = 0; paso < MAX_PASOS; paso++) {
      let respuesta: Anthropic.Message;
      try {
        respuesta = await cliente.messages.create({
          model: MODELO,
          max_tokens: 1024,
          system: instruccionSistema,
          tools: definiciones,
          messages: mensajes,
        });
      } catch (error) {
        this.logger.error('Falló la consulta al modelo de IA', error as Error);
        throw new ServiceUnavailableException(
          'El asistente no está disponible en este momento. Probá de nuevo en un rato.',
        );
      }

      // El modelo terminó de pensar: juntamos su texto y respondemos.
      if (respuesta.stop_reason !== 'tool_use') {
        return this.textoDe(respuesta);
      }

      // El modelo pidió usar una o más herramientas: las ejecutamos y le
      // devolvemos los resultados para que siga.
      mensajes.push({ role: 'assistant', content: respuesta.content });
      const resultados: Anthropic.ToolResultBlockParam[] = [];
      for (const bloque of respuesta.content) {
        if (bloque.type !== 'tool_use') {
          continue;
        }
        resultados.push(await this.ejecutarHerramienta(bloque, herramientas));
      }
      mensajes.push({ role: 'user', content: resultados });
    }

    return 'No pude resolver la consulta en este momento. Probá reformulándola.';
  }

  private async ejecutarHerramienta(
    bloque: Anthropic.ToolUseBlock,
    herramientas: Herramienta[],
  ): Promise<Anthropic.ToolResultBlockParam> {
    const herramienta = herramientas.find((h) => h.nombre === bloque.name);
    if (!herramienta) {
      return {
        type: 'tool_result',
        tool_use_id: bloque.id,
        content: 'Herramienta desconocida.',
        is_error: true,
      };
    }
    try {
      const datos = await herramienta.ejecutar(
        (bloque.input ?? {}) as Record<string, unknown>,
      );
      return {
        type: 'tool_result',
        tool_use_id: bloque.id,
        content: JSON.stringify(datos),
      };
    } catch (error) {
      this.logger.error(
        `Falló la herramienta "${bloque.name}"`,
        error as Error,
      );
      return {
        type: 'tool_result',
        tool_use_id: bloque.id,
        content: 'No se pudo obtener ese dato.',
        is_error: true,
      };
    }
  }

  private textoDe(respuesta: Anthropic.Message): string {
    const texto = respuesta.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    return texto || 'No encontré una respuesta para eso.';
  }

  // Crea el cliente de Anthropic una sola vez. Si falta la clave, el asistente
  // no está configurado en esta instancia (queda apagado sin romper el resto).
  private obtenerCliente(): Anthropic {
    if (this.cliente) {
      return this.cliente;
    }
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'El asistente no está configurado en este negocio.',
      );
    }
    this.cliente = new Anthropic({ apiKey });
    return this.cliente;
  }
}
