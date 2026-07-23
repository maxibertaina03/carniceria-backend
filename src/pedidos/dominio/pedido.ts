import { randomUUID } from 'crypto';
import { Dinero } from '../../comun/dominio/dinero';
import { PedidoInvalidoException } from './excepciones';

export type EstadoPedido = 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO';

// Línea de un pedido: qué se encargó, cuánto (estimado) y a qué precio pactado.
// Los valores reales se confirman al entregar (la carne se pesa).
export class ItemPedido {
  private constructor(
    readonly productoId: string,
    readonly cantidad: number,
    readonly precioUnitario: number,
  ) {}

  static crear(datos: {
    productoId: string;
    cantidad: number;
    precioUnitario?: number;
  }): ItemPedido {
    if (!(datos.cantidad > 0)) {
      throw new PedidoInvalidoException(
        'La cantidad de cada producto del pedido debe ser mayor a cero',
      );
    }
    return new ItemPedido(
      datos.productoId,
      datos.cantidad,
      Dinero.desde(datos.precioUnitario ?? 0).monto,
    );
  }

  get subtotal(): number {
    return Dinero.desde(this.precioUnitario).multiplicarPor(this.cantidad).monto;
  }
}

export interface PropiedadesPedido {
  id: string;
  fecha: Date;
  clienteId: string | null;
  nombreContacto: string | null;
  telefono: string | null;
  fechaEntrega: Date | null;
  estado: EstadoPedido;
  observaciones: string | null;
  ventaId: string | null;
  items: ItemPedido[];
}

// Aggregate root: un encargo. Es un compromiso a futuro; no mueve stock ni
// plata. Al entregarlo pasa a ENTREGADO y se le asocia la venta generada.
export class Pedido {
  private constructor(private readonly props: PropiedadesPedido) {}

  static crear(datos: {
    clienteId?: string;
    nombreContacto?: string;
    telefono?: string;
    fechaEntrega?: Date;
    observaciones?: string;
    fecha?: Date;
    items: { productoId: string; cantidad: number; precioUnitario?: number }[];
  }): Pedido {
    if (!datos.items || datos.items.length === 0) {
      throw new PedidoInvalidoException(
        'El pedido debe tener al menos un producto',
      );
    }
    if (!datos.clienteId && !datos.nombreContacto?.trim()) {
      throw new PedidoInvalidoException(
        'Indicá para quién es el pedido (un cliente o un nombre)',
      );
    }
    return new Pedido({
      id: randomUUID(),
      fecha: datos.fecha ?? new Date(),
      clienteId: datos.clienteId ?? null,
      nombreContacto: datos.nombreContacto?.trim() || null,
      telefono: datos.telefono?.trim() || null,
      fechaEntrega: datos.fechaEntrega ?? null,
      estado: 'PENDIENTE',
      observaciones: datos.observaciones?.trim() || null,
      ventaId: null,
      items: datos.items.map((item) => ItemPedido.crear(item)),
    });
  }

  static reconstruir(props: PropiedadesPedido): Pedido {
    return new Pedido({ ...props });
  }

  get id() {
    return this.props.id;
  }
  get fecha() {
    return this.props.fecha;
  }
  get estado() {
    return this.props.estado;
  }
  get clienteId() {
    return this.props.clienteId;
  }
  get nombreContacto() {
    return this.props.nombreContacto;
  }
  get telefono() {
    return this.props.telefono;
  }
  get fechaEntrega() {
    return this.props.fechaEntrega;
  }
  get observaciones() {
    return this.props.observaciones;
  }
  get items() {
    return this.props.items;
  }
  get ventaId() {
    return this.props.ventaId;
  }
  get total(): number {
    return this.props.items.reduce((suma, item) => suma + item.subtotal, 0);
  }

  private asegurarPendiente(accion: string): void {
    if (this.props.estado !== 'PENDIENTE') {
      throw new PedidoInvalidoException(
        `No se puede ${accion}: el pedido ya está ${
          this.props.estado === 'ENTREGADO' ? 'entregado' : 'cancelado'
        }`,
      );
    }
  }

  actualizarDatos(datos: {
    clienteId?: string | null;
    nombreContacto?: string | null;
    telefono?: string | null;
    fechaEntrega?: Date | null;
    observaciones?: string | null;
    items?: { productoId: string; cantidad: number; precioUnitario?: number }[];
  }): void {
    this.asegurarPendiente('editar el pedido');
    if (datos.clienteId !== undefined) this.props.clienteId = datos.clienteId;
    if (datos.nombreContacto !== undefined)
      this.props.nombreContacto = datos.nombreContacto?.trim() || null;
    if (datos.telefono !== undefined)
      this.props.telefono = datos.telefono?.trim() || null;
    if (datos.fechaEntrega !== undefined)
      this.props.fechaEntrega = datos.fechaEntrega;
    if (datos.observaciones !== undefined)
      this.props.observaciones = datos.observaciones?.trim() || null;
    if (datos.items) {
      if (datos.items.length === 0) {
        throw new PedidoInvalidoException(
          'El pedido debe tener al menos un producto',
        );
      }
      this.props.items = datos.items.map((item) => ItemPedido.crear(item));
    }
  }

  cancelar(): void {
    this.asegurarPendiente('cancelar el pedido');
    this.props.estado = 'CANCELADO';
  }

  // Marca el pedido como entregado y lo liga a la venta ya generada.
  marcarEntregado(ventaId: string): void {
    this.asegurarPendiente('entregar el pedido');
    this.props.estado = 'ENTREGADO';
    this.props.ventaId = ventaId;
  }
}
