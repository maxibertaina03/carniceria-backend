import { ExcepcionDominio } from '../../comun/dominio/excepcion-dominio';

export class DesposteInvalidoException extends ExcepcionDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class DesposteNoEncontradoException extends ExcepcionDominio {
  constructor(id: string) {
    super(`No se encontró el desposte con id ${id}`, 404);
  }
}
