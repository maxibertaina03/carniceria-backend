import { ExcepcionDominio } from './excepcion-dominio';
import { redondearMoneda } from './redondeo';

export class MontoInvalidoException extends ExcepcionDominio {
  constructor(monto: number) {
    super(`El monto ${monto} no es válido: debe ser un número mayor o igual a cero`);
  }
}

// Value object: un monto de dinero no negativo, redondeado a 2 decimales.
export class Dinero {
  private constructor(readonly monto: number) {}

  static desde(monto: number): Dinero {
    if (!Number.isFinite(monto) || monto < 0) {
      throw new MontoInvalidoException(monto);
    }
    return new Dinero(redondearMoneda(monto));
  }

  static cero(): Dinero {
    return new Dinero(0);
  }

  sumar(otro: Dinero): Dinero {
    return Dinero.desde(this.monto + otro.monto);
  }

  multiplicarPor(cantidad: number): Dinero {
    return Dinero.desde(this.monto * cantidad);
  }

  esMayorQue(otro: Dinero): boolean {
    return this.monto > otro.monto;
  }

  esCero(): boolean {
    return this.monto === 0;
  }
}
