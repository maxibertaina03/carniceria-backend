// Puerto del contexto Asistente hacia el modelo de lenguaje (IA). El dominio y
// la aplicación NO conocen a Anthropic ni a ningún proveedor: hablan por acá.
// El adaptador concreto vive en infraestructura.

// Una herramienta de SOLO LECTURA que el asistente puede usar para responder.
// El modelo elige cuál usar y con qué parámetros; nosotros la ejecutamos. Nunca
// hay escritura ni acceso directo a la base: solo estas consultas cerradas.
export interface Herramienta {
  // Nombre técnico (ej. "ventas_por_periodo"). El modelo lo usa para invocarla.
  nombre: string;
  // Para qué sirve, en palabras. El modelo lee esto para decidir cuándo usarla.
  descripcion: string;
  // JSON Schema de los parámetros que recibe (un objeto). Vacío si no lleva.
  esquema: Record<string, unknown>;
  // Ejecuta la consulta y devuelve los datos (se serializan a JSON para el modelo).
  ejecutar(parametros: Record<string, unknown>): Promise<unknown>;
}

// Puerto: dada una pregunta, un set de herramientas de consulta y una
// instrucción de sistema, devuelve la respuesta en texto (español).
export abstract class ProveedorIA {
  abstract responder(
    pregunta: string,
    herramientas: Herramienta[],
    instruccionSistema: string,
  ): Promise<string>;
}
