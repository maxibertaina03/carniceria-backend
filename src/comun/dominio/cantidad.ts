import { ExcepcionDominio } from './excepcion-dominio';
import { redondearCantidad } from './redondeo';
import { UnidadMedida } from './unidad-medida';

export class CantidadInvalidaException extends ExcepcionDominio {
  constructor(valor: number) {
    super(`La cantidad ${valor} no es válida: debe ser un número mayor a cero`);
  }
}

// Value object: una cantidad positiva con su unidad de medida (ej. 1.5 KG).
export class Cantidad {
  private constructor(
    readonly valor: number,
    readonly unidad: UnidadMedida,
  ) {}

  static desde(valor: number, unidad: UnidadMedida): Cantidad {
    if (!Number.isFinite(valor) || valor <= 0) {
      throw new CantidadInvalidaException(valor);
    }
    return new Cantidad(redondearCantidad(valor), unidad);
  }
}
