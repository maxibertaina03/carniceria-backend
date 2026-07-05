import { ExcepcionDominio } from '../../comun/dominio/excepcion-dominio';

export class CompraInvalidaException extends ExcepcionDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class CompraNoEncontradaException extends ExcepcionDominio {
  constructor(id: string) {
    super(`No se encontró la compra con id ${id}`, 404);
  }
}
