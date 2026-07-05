import { ExcepcionDominio } from '../../comun/dominio/excepcion-dominio';

export class VentaInvalidaException extends ExcepcionDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class VentaNoEncontradaException extends ExcepcionDominio {
  constructor(id: string) {
    super(`No se encontró la venta con id ${id}`, 404);
  }
}
