import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServicioPresentaciones } from '../aplicacion/servicio-presentaciones';
import { Presentacion } from '../dominio/presentacion';
import {
  ActualizarPresentacionDto,
  CrearPresentacionDto,
} from './dto/presentacion.dto';

function aRespuesta(p: Presentacion) {
  return {
    id: p.id,
    productoId: p.productoId,
    nombre: p.nombre,
    cantidadEquivalente: p.cantidadEquivalente,
    precio: p.precio,
    activo: p.activo,
  };
}

@ApiTags('Presentaciones')
@Controller('presentaciones')
export class PresentacionesController {
  constructor(private readonly servicio: ServicioPresentaciones) {}

  @Get()
  @ApiOperation({ summary: 'Listar presentaciones (opcionalmente de un producto)' })
  async listar(@Query('productoId') productoId?: string) {
    const presentaciones = await this.servicio.listar(productoId);
    return presentaciones.map(aRespuesta);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una presentación para un producto' })
  async crear(@Body() dto: CrearPresentacionDto) {
    return aRespuesta(await this.servicio.crear(dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar una presentación' })
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarPresentacionDto,
  ) {
    return aRespuesta(await this.servicio.actualizar(id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borrar una presentación' })
  async eliminar(@Param('id') id: string) {
    await this.servicio.eliminar(id);
  }
}
