import { randomUUID } from 'crypto';
import { Cantidad } from '../../comun/dominio/cantidad';
import { Dinero } from '../../comun/dominio/dinero';
import { redondearCantidad } from '../../comun/dominio/redondeo';
import { UnidadMedida } from '../../comun/dominio/unidad-medida';
import {
  ProductoInvalidoException,
  StockInsuficienteException,
} from './excepciones';

export interface PropiedadesProducto {
  id: string;
  nombre: string;
  // Código de categoría (validado contra la config del rubro en la capa de aplicación).
  categoria: string;
  subcategoria: string | null;
  unidadMedida: UnidadMedida;
  stockActual: number;
  costoUnitarioReferencia: number;
  precioVentaReferencia: number;
  seVende: boolean;
  // Días que dura desde su elaboración (para lotes con vencimiento). Null = no vence.
  diasVencimiento: number | null;
  // Foto del producto (opcional), guardada como data URI (base64). Null = sin foto.
  imagen: string | null;
  activo: boolean;
  fechaCreacion: Date;
}

export interface DatosNuevoProducto {
  nombre: string;
  categoria: string;
  subcategoria?: string;
  unidadMedida?: UnidadMedida;
  costoUnitarioReferencia?: number;
  precioVentaReferencia?: number;
  seVende?: boolean;
  diasVencimiento?: number | null;
  imagen?: string | null;
  // Cuánto hay hoy de este producto al darlo de alta (opcional).
  stockInicial?: number;
}

// Aggregate root del catálogo: qué se vende y cuánto stock hay.
export class Producto {
  private constructor(private readonly props: PropiedadesProducto) {}

  static crear(datos: DatosNuevoProducto): Producto {
    return new Producto({
      id: randomUUID(),
      nombre: Producto.validarNombre(datos.nombre),
      categoria: datos.categoria,
      subcategoria: datos.subcategoria?.trim() || null,
      unidadMedida: datos.unidadMedida ?? 'KG',
      stockActual: Producto.validarStock(datos.stockInicial ?? 0),
      costoUnitarioReferencia: Dinero.desde(
        datos.costoUnitarioReferencia ?? 0,
      ).monto,
      precioVentaReferencia: Dinero.desde(
        datos.precioVentaReferencia ?? 0,
      ).monto,
      seVende: datos.seVende ?? true,
      diasVencimiento: Producto.validarDiasVencimiento(datos.diasVencimiento),
      imagen: datos.imagen || null,
      activo: true,
      fechaCreacion: new Date(),
    });
  }

  private static validarDiasVencimiento(dias?: number | null): number | null {
    if (dias === undefined || dias === null) return null;
    if (!Number.isInteger(dias) || dias <= 0) {
      throw new ProductoInvalidoException(
        'Los días de vencimiento deben ser un número entero mayor a cero',
      );
    }
    return dias;
  }

  static reconstruir(props: PropiedadesProducto): Producto {
    return new Producto({ ...props });
  }

  // El stock nunca puede ser negativo, ni al darlo de alta ni al ajustarlo.
  private static validarStock(cantidad: number): number {
    if (!Number.isFinite(cantidad) || cantidad < 0) {
      throw new ProductoInvalidoException(
        'El stock no puede ser negativo',
      );
    }
    return redondearCantidad(cantidad);
  }

  private static validarNombre(nombre: string): string {
    const limpio = nombre?.trim();
    if (!limpio) {
      throw new ProductoInvalidoException(
        'El nombre del producto no puede estar vacío',
      );
    }
    return limpio;
  }

  get id() {
    return this.props.id;
  }
  get nombre() {
    return this.props.nombre;
  }
  get categoria() {
    return this.props.categoria;
  }
  get subcategoria() {
    return this.props.subcategoria;
  }
  get unidadMedida() {
    return this.props.unidadMedida;
  }
  get stockActual() {
    return this.props.stockActual;
  }
  get costoUnitarioReferencia() {
    return this.props.costoUnitarioReferencia;
  }
  get precioVentaReferencia() {
    return this.props.precioVentaReferencia;
  }
  get seVende() {
    return this.props.seVende;
  }
  get diasVencimiento() {
    return this.props.diasVencimiento;
  }
  get imagen() {
    return this.props.imagen;
  }
  get activo() {
    return this.props.activo;
  }
  get fechaCreacion() {
    return this.props.fechaCreacion;
  }

  aumentarStock(cantidad: Cantidad): void {
    this.props.stockActual = redondearCantidad(
      this.props.stockActual + cantidad.valor,
    );
  }

  // Invariante: el stock no puede quedar negativo (decisión de negocio:
  // una venta sin stock suficiente se bloquea).
  disminuirStock(cantidad: Cantidad): void {
    if (cantidad.valor > this.props.stockActual) {
      throw new StockInsuficienteException(
        this.props.nombre,
        this.props.stockActual,
        cantidad.valor,
        this.props.unidadMedida,
      );
    }
    this.props.stockActual = redondearCantidad(
      this.props.stockActual - cantidad.valor,
    );
  }

  // Deja el stock en la cantidad indicada (ej. después de contar lo que hay
  // en la heladera). No es un movimiento de compra ni de venta: es una
  // corrección de inventario.
  ajustarStock(cantidad: number): void {
    this.props.stockActual = Producto.validarStock(cantidad);
  }

  actualizarPreciosReferencia(costo?: Dinero, precioVenta?: Dinero): void {
    if (costo !== undefined) {
      this.props.costoUnitarioReferencia = costo.monto;
    }
    if (precioVenta !== undefined) {
      this.props.precioVentaReferencia = precioVenta.monto;
    }
  }

  actualizarDatos(datos: {
    nombre?: string;
    categoria?: string;
    subcategoria?: string | null;
    unidadMedida?: UnidadMedida;
    seVende?: boolean;
    diasVencimiento?: number | null;
    imagen?: string | null;
  }): void {
    if (datos.diasVencimiento !== undefined) {
      this.props.diasVencimiento = Producto.validarDiasVencimiento(
        datos.diasVencimiento,
      );
    }
    if (datos.imagen !== undefined) {
      this.props.imagen = datos.imagen || null;
    }
    if (datos.nombre !== undefined) {
      this.props.nombre = Producto.validarNombre(datos.nombre);
    }
    if (datos.categoria !== undefined) {
      this.props.categoria = datos.categoria;
    }
    if (datos.subcategoria !== undefined) {
      this.props.subcategoria =
        datos.subcategoria === null ? null : datos.subcategoria.trim() || null;
    }
    if (datos.unidadMedida !== undefined) {
      this.props.unidadMedida = datos.unidadMedida;
    }
    if (datos.seVende !== undefined) {
      this.props.seVende = datos.seVende;
    }
  }

  desactivar(): void {
    this.props.activo = false;
  }

  activar(): void {
    this.props.activo = true;
  }
}
