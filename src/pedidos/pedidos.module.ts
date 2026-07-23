import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { VentasModule } from '../ventas/ventas.module';
import { ConsultaPedidos } from './aplicacion/puertos/consulta-pedidos';
import { ServicioPedidos } from './aplicacion/servicio-pedidos';
import { RepositorioPedido } from './dominio/repositorio-pedido';
import { ConsultaPedidosPrisma } from './infraestructura/consulta-pedidos-prisma';
import { RepositorioPedidoPrisma } from './infraestructura/repositorio-pedido-prisma';
import { PedidosController } from './interfaces/pedidos.controller';

@Module({
  // Catálogo para validar productos; Ventas para generar la venta al entregar.
  imports: [CatalogoModule, VentasModule],
  controllers: [PedidosController],
  providers: [
    ServicioPedidos,
    { provide: RepositorioPedido, useClass: RepositorioPedidoPrisma },
    { provide: ConsultaPedidos, useClass: ConsultaPedidosPrisma },
  ],
})
export class PedidosModule {}
