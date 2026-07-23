import { ExcepcionDominio } from '../../comun/dominio/excepcion-dominio';

export class PedidoInvalidoException extends ExcepcionDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class PedidoNoEncontradoException extends ExcepcionDominio {
  constructor(id: string) {
    super(`No se encontró el pedido con id ${id}`, 404);
  }
}
