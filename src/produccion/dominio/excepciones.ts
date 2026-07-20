import { ExcepcionDominio } from '../../comun/dominio/excepcion-dominio';

export class RecetaInvalidaException extends ExcepcionDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class RecetaNoEncontradaException extends ExcepcionDominio {
  constructor(mensaje = 'No se encontró la receta') {
    super(mensaje, 404);
  }
}

export class ProduccionInvalidaException extends ExcepcionDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class OrdenProduccionNoEncontradaException extends ExcepcionDominio {
  constructor(id: string) {
    super(`No se encontró la orden de producción con id ${id}`, 404);
  }
}
