import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { ConsultasProduccion } from './aplicacion/puertos/consultas-produccion';
import { RecalculadorCostos } from './aplicacion/puertos/recalculador-costos';
import { ServicioCostosProducidos } from './aplicacion/servicio-costos-producidos';
import { ServicioProduccion } from './aplicacion/servicio-produccion';
import { ServicioRecetas } from './aplicacion/servicio-recetas';
import {
  RepositorioOrdenProduccion,
  RepositorioReceta,
} from './dominio/repositorios';
import { ConsultasProduccionPrisma } from './infraestructura/consultas-produccion-prisma';
import { RepositorioOrdenProduccionPrisma } from './infraestructura/repositorio-orden-produccion-prisma';
import { RepositorioRecetaPrisma } from './infraestructura/repositorio-receta-prisma';
import { ProduccionController } from './interfaces/produccion.controller';
import { RecetasController } from './interfaces/recetas.controller';

@Module({
  imports: [CatalogoModule],
  controllers: [RecetasController, ProduccionController],
  providers: [
    ServicioRecetas,
    ServicioProduccion,
    { provide: RecalculadorCostos, useClass: ServicioCostosProducidos },
    { provide: RepositorioReceta, useClass: RepositorioRecetaPrisma },
    { provide: RepositorioOrdenProduccion, useClass: RepositorioOrdenProduccionPrisma },
    { provide: ConsultasProduccion, useClass: ConsultasProduccionPrisma },
  ],
  // Compras y Desposte usan el recálculo cuando cambian costos de insumos.
  exports: [RecalculadorCostos],
})
export class ProduccionModule {}
