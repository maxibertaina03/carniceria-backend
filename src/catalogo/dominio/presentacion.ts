import { randomUUID } from 'crypto';
import { Dinero } from '../../comun/dominio/dinero';
import { redondearCantidad } from '../../comun/dominio/redondeo';
import { ProductoInvalidoException } from './excepciones';

export interface PropiedadesPresentacion {
  id: string;
  productoId: string;
  nombre: string;
  cantidadEquivalente: number;
  precio: number;
  activo: boolean;
}

// Una presentación de venta de un producto (½ kg, docena…). "cantidadEquivalente"
// es cuánto del stock base representa una unidad de esta presentación.
export class Presentacion {
  private constructor(private readonly props: PropiedadesPresentacion) {}

  static crear(datos: {
    productoId: string;
    nombre: string;
    cantidadEquivalente: number;
    precio: number;
  }): Presentacion {
    return new Presentacion({
      id: randomUUID(),
      productoId: datos.productoId,
      nombre: Presentacion.validarNombre(datos.nombre),
      cantidadEquivalente: Presentacion.validarEquivalente(datos.cantidadEquivalente),
      precio: Dinero.desde(datos.precio).monto,
      activo: true,
    });
  }

  static reconstruir(props: PropiedadesPresentacion): Presentacion {
    return new Presentacion({ ...props });
  }

  private static validarNombre(nombre: string): string {
    const limpio = nombre?.trim();
    if (!limpio) {
      throw new ProductoInvalidoException('La presentación necesita un nombre');
    }
    return limpio;
  }

  private static validarEquivalente(valor: number): number {
    const cantidad = redondearCantidad(valor);
    if (!(cantidad > 0)) {
      throw new ProductoInvalidoException(
        'La cantidad equivalente de la presentación debe ser mayor a cero',
      );
    }
    return cantidad;
  }

  actualizar(datos: {
    nombre?: string;
    cantidadEquivalente?: number;
    precio?: number;
    activo?: boolean;
  }): void {
    if (datos.nombre !== undefined) {
      this.props.nombre = Presentacion.validarNombre(datos.nombre);
    }
    if (datos.cantidadEquivalente !== undefined) {
      this.props.cantidadEquivalente = Presentacion.validarEquivalente(
        datos.cantidadEquivalente,
      );
    }
    if (datos.precio !== undefined) {
      this.props.precio = Dinero.desde(datos.precio).monto;
    }
    if (datos.activo !== undefined) {
      this.props.activo = datos.activo;
    }
  }

  get id() {
    return this.props.id;
  }
  get productoId() {
    return this.props.productoId;
  }
  get nombre() {
    return this.props.nombre;
  }
  get cantidadEquivalente() {
    return this.props.cantidadEquivalente;
  }
  get precio() {
    return this.props.precio;
  }
  get activo() {
    return this.props.activo;
  }
}
