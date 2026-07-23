import { Injectable } from '@nestjs/common';
import { LectorProductosCatalogo } from '../../catalogo/aplicacion/puertos/lector-productos-catalogo';
import {
  PedidoInvalidoException,
  PedidoNoEncontradoException,
} from '../dominio/excepciones';
import { Pedido } from '../dominio/pedido';
import { RepositorioPedido } from '../dominio/repositorio-pedido';
import { ConsultaPedidos, PedidoDetalle } from './puertos/consulta-pedidos';
import { RegistradorVentaDesdePedido } from './puertos/registrador-venta-desde-pedido';

export interface DatosPedido {
  clienteId?: string;
  nombreContacto?: string;
  telefono?: string;
  fechaEntrega?: Date;
  observaciones?: string;
  items: { productoId: string; cantidad: number; precioUnitario?: number }[];
}

export interface DatosEntrega {
  // Cliente al que se le fía (si el pedido no tenía uno y la entrega es fiada).
  clienteId?: string;
  montoFiado?: number;
  observaciones?: string;
  // Cantidades y precios reales confirmados al entregar (la carne se pesa).
  // Si no se envían, se usan los del pedido.
  items?: {
    productoId: string;
    cantidad: number;
    precioUnitarioVenta: number;
  }[];
}

@Injectable()
export class ServicioPedidos {
  constructor(
    private readonly repositorio: RepositorioPedido,
    private readonly consulta: ConsultaPedidos,
    private readonly lectorProductos: LectorProductosCatalogo,
    private readonly registradorVenta: RegistradorVentaDesdePedido,
  ) {}

  async crear(datos: DatosPedido): Promise<PedidoDetalle> {
    await this.verificarProductos(datos.items);
    const pedido = Pedido.crear(datos);
    await this.repositorio.guardar(pedido);
    return this.obtener(pedido.id);
  }

  listar(soloPendientes = false): Promise<PedidoDetalle[]> {
    return this.consulta.listar(soloPendientes);
  }

  async obtener(id: string): Promise<PedidoDetalle> {
    const pedido = await this.consulta.obtenerPorId(id);
    if (!pedido) {
      throw new PedidoNoEncontradoException(id);
    }
    return pedido;
  }

  async actualizar(id: string, datos: DatosPedido): Promise<PedidoDetalle> {
    const pedido = await this.cargar(id);
    if (datos.items) {
      await this.verificarProductos(datos.items);
    }
    pedido.actualizarDatos(datos);
    await this.repositorio.guardar(pedido);
    return this.obtener(id);
  }

  async cancelar(id: string): Promise<PedidoDetalle> {
    const pedido = await this.cargar(id);
    pedido.cancelar();
    await this.repositorio.guardar(pedido);
    return this.obtener(id);
  }

  async eliminar(id: string): Promise<void> {
    const pedido = await this.cargar(id);
    if (pedido.estado === 'ENTREGADO') {
      throw new PedidoInvalidoException(
        'No se puede borrar un pedido ya entregado (tiene una venta asociada)',
      );
    }
    await this.repositorio.eliminar(id);
  }

  // Entrega el pedido: genera la venta (reusa toda la lógica de Ventas: descuenta
  // stock con bloqueo, calcula ganancia y, si es fiado, genera la deuda) y luego
  // marca el pedido como entregado con su venta asociada.
  async entregar(id: string, datos: DatosEntrega): Promise<PedidoDetalle> {
    const pedido = await this.cargar(id);
    if (pedido.estado !== 'PENDIENTE') {
      throw new PedidoInvalidoException(
        'Este pedido ya no está pendiente de entrega',
      );
    }

    const items =
      datos.items && datos.items.length > 0
        ? datos.items
        : pedido.items.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitarioVenta: item.precioUnitario,
          }));

    const clienteId = datos.clienteId ?? pedido.clienteId ?? undefined;
    if ((datos.montoFiado ?? 0) > 0 && !clienteId) {
      throw new PedidoInvalidoException(
        'Para entregar fiado hay que indicar el cliente',
      );
    }

    // La venta corre en su propia transacción (bloquea si falta stock).
    const ventaId = await this.registradorVenta.registrarVenta({
      clienteId,
      montoFiado: datos.montoFiado,
      observaciones: datos.observaciones,
      items,
    });

    pedido.marcarEntregado(ventaId);
    await this.repositorio.guardar(pedido);
    return this.obtener(id);
  }

  private async cargar(id: string): Promise<Pedido> {
    const pedido = await this.repositorio.obtenerPorId(id);
    if (!pedido) {
      throw new PedidoNoEncontradoException(id);
    }
    return pedido;
  }

  private async verificarProductos(
    items: { productoId: string }[],
  ): Promise<void> {
    for (const item of items ?? []) {
      const producto = await this.lectorProductos.obtenerProducto(item.productoId);
      if (!producto) {
        throw new PedidoInvalidoException(
          'Uno de los productos del pedido no existe',
        );
      }
    }
  }
}
