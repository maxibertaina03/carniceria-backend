import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServicioDesposte } from '../aplicacion/servicio-desposte';
import { RegistrarDesposteDto } from './dto/registrar-desposte.dto';

@ApiTags('Desposte')
@Controller('despostes')
export class DespostesController {
  constructor(private readonly servicio: ServicioDesposte) {}

  @Post()
  @ApiOperation({
    summary:
      'Registrar el desposte de una media res: los cortes ingresan al stock con el costo repartido según su valor',
  })
  registrar(@Body() dto: RegistrarDesposteDto) {
    return this.servicio.registrar({
      proveedor: dto.proveedor,
      pesoRes: dto.pesoRes,
      costoTotal: dto.costoTotal,
      observaciones: dto.observaciones,
      fecha: dto.fecha ? new Date(dto.fecha) : undefined,
      cortes: dto.cortes,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar despostes (más recientes primero)' })
  listar() {
    return this.servicio.listar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver el detalle de un desposte' })
  obtener(@Param('id') id: string) {
    return this.servicio.obtener(id);
  }
}
