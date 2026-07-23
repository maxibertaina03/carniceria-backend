import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { CuentasCorrientesModule } from '../cuentas-corrientes/cuentas-corrientes.module';
import { RegistradorVentaDesdePedido } from '../pedidos/aplicacion/puertos/registrador-venta-desde-pedido';
import { ConsultaVentas } from './aplicacion/puertos/consulta-ventas';
import { ServicioVentas } from './aplicacion/servicio-ventas';
import { RepositorioVenta } from './dominio/repositorio-venta';
import { RegistradorVentaDesdePedidoVentas } from './infraestructura/adaptadores/registrador-venta-desde-pedido-ventas';
import { ConsultaVentasPrisma } from './infraestructura/consulta-ventas-prisma';
import { RepositorioVentaPrisma } from './infraestructura/repositorio-venta-prisma';
import { VentasController } from './interfaces/ventas.controller';

@Module({
  imports: [CatalogoModule, CuentasCorrientesModule],
  controllers: [VentasController],
  providers: [
    ServicioVentas,
    { provide: RepositorioVenta, useClass: RepositorioVentaPrisma },
    { provide: ConsultaVentas, useClass: ConsultaVentasPrisma },
    // Adaptador del puerto que Pedidos define sobre Ventas (entregar = vender).
    { provide: RegistradorVentaDesdePedido, useClass: RegistradorVentaDesdePedidoVentas },
  ],
  exports: [RegistradorVentaDesdePedido],
})
export class VentasModule {}
