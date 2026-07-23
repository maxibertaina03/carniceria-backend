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
import { ServicioGastos } from '../aplicacion/servicio-gastos';
import { CrearGastoDto } from './dto/crear-gasto.dto';

@ApiTags('Gastos')
@Controller('gastos')
export class GastosController {
  constructor(private readonly servicio: ServicioGastos) {}

  @Get()
  @ApiOperation({ summary: 'Listar gastos (más recientes primero)' })
  listar() {
    return this.servicio.listar();
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar un gasto (pagado, o adeudado a un proveedor)',
  })
  crear(@Body() dto: CrearGastoDto) {
    return this.servicio.crear({
      concepto: dto.concepto,
      categoria: dto.categoria,
      monto: dto.monto,
      adeudado: dto.adeudado,
      fechaVencimiento: dto.fechaVencimiento
        ? new Date(dto.fechaVencimiento)
        : undefined,
      proveedorId: dto.proveedorId,
      observaciones: dto.observaciones,
      fecha: dto.fecha ? new Date(dto.fecha) : undefined,
    });
  }

  @Post(':id/pagar')
  @ApiOperation({ summary: 'Marcar una boleta adeudada como pagada' })
  pagar(@Param('id') id: string) {
    return this.servicio.pagar(id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borrar un gasto (si era adeudado, revierte la deuda)' })
  async eliminar(@Param('id') id: string) {
    await this.servicio.eliminar(id);
  }
}
