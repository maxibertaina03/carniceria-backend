import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { ProduccionModule } from '../produccion/produccion.module';
import { ConsultaDespostes } from './aplicacion/puertos/consulta-despostes';
import { ServicioDesposte } from './aplicacion/servicio-desposte';
import { RepositorioDesposte } from './dominio/repositorio-desposte';
import { ConsultaDespostesPrisma } from './infraestructura/consulta-despostes-prisma';
import { RepositorioDespostePrisma } from './infraestructura/repositorio-desposte-prisma';
import { DespostesController } from './interfaces/despostes.controller';

@Module({
  imports: [CatalogoModule, ProduccionModule],
  controllers: [DespostesController],
  providers: [
    ServicioDesposte,
    { provide: RepositorioDesposte, useClass: RepositorioDespostePrisma },
    { provide: ConsultaDespostes, useClass: ConsultaDespostesPrisma },
  ],
})
export class DesposteModule {}
