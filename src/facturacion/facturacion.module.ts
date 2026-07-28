import { Module } from '@nestjs/common';
import { ServicioFacturacion } from './aplicacion/servicio-facturacion';
import { RepositorioComprobante } from './dominio/repositorio-comprobante';
import { RepositorioComprobantePrisma } from './infraestructura/repositorio-comprobante-prisma';
import { FacturacionController } from './interfaces/facturacion.controller';

@Module({
  controllers: [FacturacionController],
  providers: [
    ServicioFacturacion,
    { provide: RepositorioComprobante, useClass: RepositorioComprobantePrisma },
  ],
})
export class FacturacionModule {}
