import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServicioCompras } from '../aplicacion/servicio-compras';
import { RegistrarCompraDto } from './dto/registrar-compra.dto';

@ApiTags('Compras')
@Controller('compras')
export class ComprasController {
  constructor(private readonly servicio: ServicioCompras) {}

  @Post()
  @ApiOperation({
    summary:
      'Registrar una compra a proveedor (suma stock y actualiza el costo de referencia de cada producto)',
  })
  registrar(@Body() dto: RegistrarCompraDto) {
    return this.servicio.registrar({
      proveedor: dto.proveedor,
      observaciones: dto.observaciones,
      fecha: dto.fecha ? new Date(dto.fecha) : undefined,
      items: dto.items,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar compras (más recientes primero)' })
  listar() {
    return this.servicio.listar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver el detalle de una compra' })
  obtener(@Param('id') id: string) {
    return this.servicio.obtener(id);
  }
}
