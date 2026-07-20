import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServicioRecetas } from '../aplicacion/servicio-recetas';
import { GuardarRecetaDto } from './dto/guardar-receta.dto';

@ApiTags('Producción - Recetas')
@Controller('recetas')
export class RecetasController {
  constructor(private readonly servicio: ServicioRecetas) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las recetas (fórmulas) cargadas' })
  listar() {
    return this.servicio.listar();
  }

  @Get('producto/:productoId')
  @ApiOperation({ summary: 'Ver la receta de un producto terminado' })
  async porProducto(@Param('productoId') productoId: string) {
    const receta = await this.servicio.obtenerPorProducto(productoId);
    if (!receta) {
      throw new NotFoundException('Este producto todavía no tiene receta cargada');
    }
    return receta;
  }

  @Put()
  @ApiOperation({
    summary: 'Crear o actualizar la receta de un producto (una receta por producto)',
  })
  guardar(@Body() dto: GuardarRecetaDto) {
    return this.servicio.guardar(dto);
  }

  @Delete('producto/:productoId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar la receta de un producto' })
  async eliminar(@Param('productoId') productoId: string) {
    await this.servicio.eliminar(productoId);
  }
}
