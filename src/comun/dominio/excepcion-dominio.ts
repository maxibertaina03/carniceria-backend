// Base de todas las excepciones de negocio. El filtro global las convierte
// en respuestas HTTP con mensaje en español (ver infraestructura).
export abstract class ExcepcionDominio extends Error {
  constructor(
    mensaje: string,
    readonly codigoHttp: number = 400,
  ) {
    super(mensaje);
    this.name = this.constructor.name;
  }
}
