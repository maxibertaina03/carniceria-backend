import { ExcepcionDominio } from '../../comun/dominio/excepcion-dominio';

export class ProductoNoEncontradoException extends ExcepcionDominio {
  constructor(id: string) {
    super(`No se encontró el producto con id ${id}`, 404);
  }
}

export class NombreProductoDuplicadoException extends ExcepcionDominio {
  constructor(nombre: string) {
    super(`Ya existe un producto activo con el nombre "${nombre}"`);
  }
}

export class ProductoInvalidoException extends ExcepcionDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class StockInsuficienteException extends ExcepcionDominio {
  constructor(
    nombreProducto: string,
    stockDisponible: number,
    cantidadPedida: number,
    unidad: string,
  ) {
    super(
      `Stock insuficiente de "${nombreProducto}": hay ${stockDisponible} ${unidad} disponibles y se pidieron ${cantidadPedida} ${unidad}`,
    );
  }
}
