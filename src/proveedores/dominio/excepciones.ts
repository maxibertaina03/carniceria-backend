import { ExcepcionDominio } from '../../comun/dominio/excepcion-dominio';

export class ProveedorNoEncontradoException extends ExcepcionDominio {
  constructor(id: string) {
    super(`No se encontró el proveedor con id ${id}`, 404);
  }
}

export class ProveedorInvalidoException extends ExcepcionDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class PagoProveedorInvalidoException extends ExcepcionDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}
