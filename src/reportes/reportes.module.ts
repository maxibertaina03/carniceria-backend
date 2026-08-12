import { Module } from '@nestjs/common';
import { ConsultasReportes } from './aplicacion/puertos/consultas-reportes';
import { ServicioReportes } from './aplicacion/servicio-reportes';
import { ConsultasReportesPrisma } from './infraestructura/consultas-reportes-prisma';
import { ReportesController } from './interfaces/reportes.controller';

@Module({
  controllers: [ReportesController],
  providers: [
    ServicioReportes,
    { provide: ConsultasReportes, useClass: ConsultasReportesPrisma },
  ],
  // Se exporta el puerto para que el contexto Asistente reutilice las consultas
  // de solo lectura (ventas, deudas, stock, resumen) sin duplicarlas.
  exports: [ConsultasReportes],
})
export class ReportesModule {}
