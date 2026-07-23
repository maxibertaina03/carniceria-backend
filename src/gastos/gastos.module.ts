import { Module } from '@nestjs/common';
import { ProveedoresModule } from '../proveedores/proveedores.module';
import { ServicioGastos } from './aplicacion/servicio-gastos';
import { RepositorioGasto } from './dominio/repositorio-gasto';
import { RepositorioGastoPrisma } from './infraestructura/repositorio-gasto-prisma';
import { GastosController } from './interfaces/gastos.controller';

@Module({
  imports: [ProveedoresModule],
  controllers: [GastosController],
  providers: [
    ServicioGastos,
    { provide: RepositorioGasto, useClass: RepositorioGastoPrisma },
  ],
})
export class GastosModule {}
