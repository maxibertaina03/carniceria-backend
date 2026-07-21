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
import { ServicioClientes } from '../aplicacion/servicio-clientes';
import { ActualizarClienteDto } from './dto/actualizar-cliente.dto';
import { CrearClienteDto } from './dto/crear-cliente.dto';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';
import {
  aClienteRespuesta,
  aMovimientoRespuesta,
} from './dto/respuestas';

@ApiTags('Clientes (cuentas corrientes)')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly servicio: ServicioClientes) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes con su saldo deudor' })
  @ApiQuery({ name: 'incluirInactivos', required: false })
  async listar(@Query('incluirInactivos') incluirInactivos?: string) {
    const clientes = await this.servicio.listar(incluirInactivos === 'true');
    return clientes.map(aClienteRespuesta);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un cliente' })
  async crear(@Body() dto: CrearClienteDto) {
    return aClienteRespuesta(await this.servicio.crear(dto));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver la ficha de un cliente (saldo actual)' })
  async obtener(@Param('id') id: string) {
    return aClienteRespuesta(await this.servicio.obtener(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar un cliente' })
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarClienteDto) {
    return aClienteRespuesta(await this.servicio.actualizar(id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Desactivar un cliente (solo si no debe nada)' })
  async desactivar(@Param('id') id: string) {
    await this.servicio.desactivar(id);
  }

  @Delete(':id/definitivo')
  @HttpCode(204)
  @ApiOperation({
    summary:
      'Borrar un cliente definitivamente (solo si no tiene ventas ni movimientos)',
  })
  async eliminarDefinitivo(@Param('id') id: string) {
    await this.servicio.eliminarDefinitivo(id);
  }

  @Get(':id/movimientos')
  @ApiOperation({
    summary: 'Historial completo de la cuenta: cargos (ventas fiadas) y pagos',
  })
  async movimientos(@Param('id') id: string) {
    const { cliente, movimientos } = await this.servicio.obtenerMovimientos(id);
    return {
      cliente: aClienteRespuesta(cliente),
      movimientos: movimientos.map(aMovimientoRespuesta),
    };
  }

  @Post(':id/pagos')
  @ApiOperation({ summary: 'Registrar un pago (parcial o total) del cliente' })
  async registrarPago(@Param('id') id: string, @Body() dto: RegistrarPagoDto) {
    const { cliente, movimiento } = await this.servicio.registrarPago(id, dto);
    return {
      cliente: aClienteRespuesta(cliente),
      movimiento: aMovimientoRespuesta(movimiento),
    };
  }
}
