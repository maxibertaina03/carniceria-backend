import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServicioAsistente } from '../aplicacion/servicio-asistente';
import { ConsultaDto } from './dto/consulta.dto';

@ApiTags('Asistente')
@Controller('asistente')
export class AsistenteController {
  constructor(private readonly servicio: ServicioAsistente) {}

  @Post('consulta')
  @ApiOperation({
    summary:
      'Responde una pregunta del negocio en lenguaje natural (solo lectura)',
  })
  async consulta(@Body() datos: ConsultaDto): Promise<{ respuesta: string }> {
    const respuesta = await this.servicio.responder(datos.pregunta);
    return { respuesta };
  }
}
