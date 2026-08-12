import { Module } from '@nestjs/common';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { ReportesModule } from '../reportes/reportes.module';
import { ProveedorIA } from './aplicacion/puertos/proveedor-ia';
import { ServicioAsistente } from './aplicacion/servicio-asistente';
import { ProveedorIaAnthropic } from './infraestructura/proveedor-ia-anthropic';
import { AsistenteController } from './interfaces/asistente.controller';

// Contexto Asistente: chatbot de soporte de SOLO LECTURA. Reutiliza las
// consultas de Reportes (por su puerto) y la config del negocio, y resuelve las
// preguntas con un ProveedorIA (adaptador Anthropic detrás del puerto).
@Module({
  imports: [ReportesModule, ConfiguracionModule],
  controllers: [AsistenteController],
  providers: [
    ServicioAsistente,
    { provide: ProveedorIA, useClass: ProveedorIaAnthropic },
  ],
})
export class AsistenteModule {}
