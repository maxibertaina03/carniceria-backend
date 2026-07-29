import { randomUUID } from 'crypto';
import { redondearCantidad } from '../../comun/dominio/redondeo';

export interface PropiedadesLote {
  id: string;
  productoId: string;
  fechaElaboracion: Date;
  fechaVencimiento: Date | null;
  cantidadInicial: number;
  cantidadDisponible: number;
}

// Un lote de stock de un producto, con su fecha de elaboración y (opcional) de
// vencimiento. El stock se descuenta de los lotes que vencen antes primero.
export class Lote {
  private constructor(private readonly props: PropiedadesLote) {}

  static crear(datos: {
    productoId: string;
    cantidad: number;
    fechaElaboracion?: Date;
    fechaVencimiento?: Date | null;
  }): Lote {
    const cantidad = redondearCantidad(datos.cantidad);
    return new Lote({
      id: randomUUID(),
      productoId: datos.productoId,
      fechaElaboracion: datos.fechaElaboracion ?? new Date(),
      fechaVencimiento: datos.fechaVencimiento ?? null,
      cantidadInicial: cantidad,
      cantidadDisponible: cantidad,
    });
  }

  static reconstruir(props: PropiedadesLote): Lote {
    return new Lote({ ...props });
  }

  // Consume hasta `cantidad` de este lote; devuelve cuánto pudo consumir
  // (puede ser menos si el lote no alcanza).
  consumir(cantidad: number): number {
    const tomado = Math.min(redondearCantidad(cantidad), this.props.cantidadDisponible);
    this.props.cantidadDisponible = redondearCantidad(
      this.props.cantidadDisponible - tomado,
    );
    return tomado;
  }

  get id() {
    return this.props.id;
  }
  get productoId() {
    return this.props.productoId;
  }
  get fechaElaboracion() {
    return this.props.fechaElaboracion;
  }
  get fechaVencimiento() {
    return this.props.fechaVencimiento;
  }
  get cantidadInicial() {
    return this.props.cantidadInicial;
  }
  get cantidadDisponible() {
    return this.props.cantidadDisponible;
  }
}
