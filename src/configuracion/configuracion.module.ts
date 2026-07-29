import { Module } from '@nestjs/common';
import { LectorConfiguracion } from './aplicacion/puertos/lector-configuracion';
import { ServicioConfiguracion } from './aplicacion/servicio-configuracion';
import { LectorConfiguracionNegocio } from './infraestructura/lector-configuracion-negocio';
import { ConfiguracionController } from './interfaces/configuracion.controller';

@Module({
  controllers: [ConfiguracionController],
  providers: [
    ServicioConfiguracion,
    { provide: LectorConfiguracion, useClass: LectorConfiguracionNegocio },
  ],
  // Se exporta el puerto para que otros contextos (Catálogo, Producción) lo usen.
  exports: [LectorConfiguracion],
})
export class ConfiguracionModule {}
