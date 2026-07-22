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
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ServicioProductos } from '../aplicacion/servicio-productos';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { AjustarStockDto } from './dto/ajustar-stock.dto';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { aProductoRespuesta } from './dto/producto-respuesta';

@ApiTags('Productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly servicio: ServicioProductos) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos con su stock actual' })
  @ApiQuery({
    name: 'incluirInactivos',
    required: false,
    description: 'Si es true, incluye también los productos desactivados',
  })
  async listar(@Query('incluirInactivos') incluirInactivos?: string) {
    const productos = await this.servicio.listar(incluirInactivos === 'true');
    return productos.map(aProductoRespuesta);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un producto nuevo' })
  async crear(@Body() dto: CrearProductoDto) {
    return aProductoRespuesta(await this.servicio.crear(dto));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver un producto' })
  async obtener(@Param('id') id: string) {
    return aProductoRespuesta(await this.servicio.obtener(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar un producto (datos, precios, activo)' })
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarProductoDto) {
    return aProductoRespuesta(await this.servicio.actualizar(id, dto));
  }

  @Post(':id/ajustar-stock')
  @ApiOperation({
    summary:
      'Ajustar el stock de un producto a la cantidad real (corrección de inventario)',
  })
  async ajustarStock(@Param('id') id: string, @Body() dto: AjustarStockDto) {
    return aProductoRespuesta(await this.servicio.ajustarStock(id, dto.cantidad));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Desactivar un producto (no se borra, deja de aparecer en la lista)',
  })
  async desactivar(@Param('id') id: string) {
    await this.servicio.desactivar(id);
  }
}
