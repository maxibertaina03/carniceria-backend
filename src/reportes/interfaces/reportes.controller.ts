import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServicioReportes } from '../aplicacion/servicio-reportes';
import { RangoFechasDto } from './dto/rango-fechas.dto';

@ApiTags('Reportes')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly servicio: ServicioReportes) {}

  @Get('ganancias')
  @ApiOperation({
    summary: 'Ganancia total, ventas y montos contado/fiado en un rango de fechas',
  })
  ganancias(@Query() rango: RangoFechasDto) {
    return this.servicio.ganancias(rango.desde, rango.hasta);
  }

  @Get('productos-mas-vendidos')
  @ApiOperation({
    summary: 'Ranking de productos por cantidad vendida (con ganancia generada)',
  })
  productosMasVendidos(@Query() rango: RangoFechasDto) {
    return this.servicio.productosMasVendidos(rango.desde, rango.hasta);
  }

  @Get('inicio')
  @ApiOperation({
    summary: 'Resumen para la pantalla de inicio: ventas de hoy, deudas, pedidos y boletas',
  })
  inicio() {
    return this.servicio.resumenInicio();
  }

  @Get('deudas')
  @ApiOperation({ summary: 'Clientes con deuda pendiente, de mayor a menor' })
  deudas() {
    return this.servicio.deudas();
  }

  @Get('stock')
  @ApiOperation({ summary: 'Stock actual de todos los productos activos' })
  stock() {
    return this.servicio.stock();
  }
}
