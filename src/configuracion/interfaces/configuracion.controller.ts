import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServicioConfiguracion } from '../aplicacion/servicio-configuracion';

@ApiTags('Configuración')
@Controller('config')
export class ConfiguracionController {
  constructor(private readonly servicio: ServicioConfiguracion) {}

  @Get()
  @ApiOperation({
    summary: 'Configuración del negocio según el rubro (nombre, módulos, categorías, features)',
  })
  obtener() {
    return this.servicio.obtener();
  }
}
