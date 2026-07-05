import { ExcepcionDominio } from '../../comun/dominio/excepcion-dominio';

export class ClienteNoEncontradoException extends ExcepcionDominio {
  constructor(id: string) {
    super(`No se encontró el cliente con id ${id}`, 404);
  }
}

export class ClienteInvalidoException extends ExcepcionDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class PagoInvalidoException extends ExcepcionDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}
