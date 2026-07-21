import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecalculadorCostos } from '../aplicacion/puertos/recalculador-costos';
import { ServicioProduccion } from '../aplicacion/servicio-produccion';
import { RegistrarProduccionDto } from './dto/registrar-produccion.dto';

@ApiTags('Producción - Órdenes')
@Controller('produccion')
export class ProduccionController {
  constructor(
    private readonly servicio: ServicioProduccion,
    private readonly recalculador: RecalculadorCostos,
  ) {}

  @Post('recalcular-costos')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Recalcular el costo de los productos producidos según el precio actual de sus insumos',
  })
  async recalcularCostos() {
    await this.recalculador.recalcularTodos();
    return { ok: true };
  }

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

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary:
      'Eliminar una producción (devuelve los ingredientes al stock y quita el terminado; se bloquea si el terminado ya se vendió)',
  })
  async eliminar(@Param('id') id: string) {
    await this.servicio.eliminar(id);
  }
}
