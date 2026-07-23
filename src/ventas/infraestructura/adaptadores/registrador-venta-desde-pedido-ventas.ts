import { Injectable } from '@nestjs/common';
import {
  DatosVentaDesdePedido,
  RegistradorVentaDesdePedido,
} from '../../../pedidos/aplicacion/puertos/registrador-venta-desde-pedido';
import { ServicioVentas } from '../../aplicacion/servicio-ventas';

// Adaptador de Ventas para el puerto que define Pedidos: entregar un pedido es
// registrar una venta con toda la lógica ya existente (stock, ganancia, fiado).
@Injectable()
export class RegistradorVentaDesdePedidoVentas extends RegistradorVentaDesdePedido {
  constructor(private readonly servicioVentas: ServicioVentas) {
    super();
  }

  async registrarVenta(datos: DatosVentaDesdePedido): Promise<string> {
    const venta = await this.servicioVentas.registrar({
      clienteId: datos.clienteId,
      montoFiado: datos.montoFiado,
      observaciones: datos.observaciones,
      items: datos.items,
    });
    return venta.id;
  }
}
