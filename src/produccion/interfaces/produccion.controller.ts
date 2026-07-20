import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServicioProduccion } from '../aplicacion/servicio-produccion';
import { RegistrarProduccionDto } from './dto/registrar-produccion.dto';

@ApiTags('Producción - Órdenes')
@Controller('produccion')
export class ProduccionController {
  constructor(private readonly servicio: ServicioProduccion) {}

  @Post()
  @ApiOperation({
    summary:
      'Registrar una producción: descuenta los ingredientes de la receta, calcula el costo y suma el producto terminado al stock',
  })
  registrar(@Body() dto: RegistrarProduccionDto) {
    return this.servicio.registrar({
      productoTerminadoId: dto.productoTerminadoId,
      cantidadProducida: dto.cantidadProducida,
      observaciones: dto.observaciones,
      fecha: dto.fecha ? new Date(dto.fecha) : undefined,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar producciones (más recientes primero)' })
  listar() {
    return this.servicio.listar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver el detalle de una producción con su costo' })
  obtener(@Param('id') id: string) {
    return this.servicio.obtener(id);
  }
}
