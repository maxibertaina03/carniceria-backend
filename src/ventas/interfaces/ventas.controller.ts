import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServicioVentas } from '../aplicacion/servicio-ventas';
import { RegistrarVentaDto } from './dto/registrar-venta.dto';

@ApiTags('Ventas')
@Controller('ventas')
export class VentasController {
  constructor(private readonly servicio: ServicioVentas) {}

  @Post()
  @ApiOperation({
    summary:
      'Registrar una venta (descuenta stock, calcula ganancia y, si hay monto fiado, genera la deuda del cliente)',
  })
  registrar(@Body() dto: RegistrarVentaDto) {
    return this.servicio.registrar({
      clienteId: dto.clienteId,
      montoFiado: dto.montoFiado,
      observaciones: dto.observaciones,
      fecha: dto.fecha ? new Date(dto.fecha) : undefined,
      items: dto.items,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar ventas (más recientes primero)' })
  listar() {
    return this.servicio.listar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver el detalle de una venta con su ganancia' })
  obtener(@Param('id') id: string) {
    return this.servicio.obtener(id);
  }
}
