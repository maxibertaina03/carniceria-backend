import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Publico } from './comun/seguridad/publico.decorator';

@ApiTags('Estado')
@Controller()
export class AppController {
  @Publico()
  @Get('salud')
  @ApiOperation({ summary: 'Chequeo de salud (público, sin clave)' })
  salud() {
    return { ok: true };
  }
}
