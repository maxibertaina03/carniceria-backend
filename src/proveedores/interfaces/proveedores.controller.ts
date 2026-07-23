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
import { ServicioProveedores } from '../aplicacion/servicio-proveedores';
import {
  ActualizarProveedorDto,
  CrearProveedorDto,
  RegistrarPagoProveedorDto,
} from './dto/proveedor.dto';
import { aMovimientoRespuesta, aProveedorRespuesta } from './dto/respuestas';

@ApiTags('Proveedores (cuentas por pagar)')
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly servicio: ServicioProveedores) {}

  @Get()
  @ApiOperation({ summary: 'Listar proveedores con lo que se les debe' })
  @ApiQuery({ name: 'incluirInactivos', required: false })
  async listar(@Query('incluirInactivos') incluirInactivos?: string) {
    const proveedores = await this.servicio.listar(incluirInactivos === 'true');
    return proveedores.map(aProveedorRespuesta);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un proveedor' })
  async crear(@Body() dto: CrearProveedorDto) {
    return aProveedorRespuesta(await this.servicio.crear(dto));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver un proveedor (cuánto se le debe)' })
  async obtener(@Param('id') id: string) {
    return aProveedorRespuesta(await this.servicio.obtener(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar un proveedor' })
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarProveedorDto) {
    return aProveedorRespuesta(await this.servicio.actualizar(id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Desactivar un proveedor (solo si no se le debe nada)' })
  async desactivar(@Param('id') id: string) {
    await this.servicio.desactivar(id);
  }

  @Delete(':id/definitivo')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Borrar un proveedor definitivamente (solo si no tiene historial)',
  })
  async eliminarDefinitivo(@Param('id') id: string) {
    await this.servicio.eliminarDefinitivo(id);
  }

  @Get(':id/movimientos')
  @ApiOperation({ summary: 'Historial de la cuenta: cargos (deudas) y pagos' })
  async movimientos(@Param('id') id: string) {
    const { proveedor, movimientos } = await this.servicio.obtenerMovimientos(id);
    return {
      proveedor: aProveedorRespuesta(proveedor),
      movimientos: movimientos.map(aMovimientoRespuesta),
    };
  }

  @Post(':id/pagos')
  @ApiOperation({ summary: 'Registrar un pago al proveedor (parcial o total)' })
  async registrarPago(
    @Param('id') id: string,
    @Body() dto: RegistrarPagoProveedorDto,
  ) {
    const { proveedor, movimiento } = await this.servicio.registrarPago(id, dto);
    return {
      proveedor: aProveedorRespuesta(proveedor),
      movimiento: aMovimientoRespuesta(movimiento),
    };
  }
}
