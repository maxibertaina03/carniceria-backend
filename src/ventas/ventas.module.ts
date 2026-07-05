import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { CuentasCorrientesModule } from '../cuentas-corrientes/cuentas-corrientes.module';
import { ConsultaVentas } from './aplicacion/puertos/consulta-ventas';
import { ServicioVentas } from './aplicacion/servicio-ventas';
import { RepositorioVenta } from './dominio/repositorio-venta';
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
  ],
})
export class VentasModule {}
