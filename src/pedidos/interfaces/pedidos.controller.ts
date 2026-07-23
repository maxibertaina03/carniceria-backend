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
import { ServicioPedidos } from '../aplicacion/servicio-pedidos';
import { CrearPedidoDto } from './dto/crear-pedido.dto';
import { EntregarPedidoDto } from './dto/entregar-pedido.dto';

@ApiTags('Pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly servicio: ServicioPedidos) {}

  @Get()
  @ApiOperation({ summary: 'Listar pedidos (pendientes primero)' })
  @ApiQuery({ name: 'soloPendientes', required: false })
  listar(@Query('soloPendientes') soloPendientes?: string) {
    return this.servicio.listar(soloPendientes === 'true');
  }

  @Post()
  @ApiOperation({ summary: 'Anotar un pedido (no mueve stock ni plata)' })
  crear(@Body() dto: CrearPedidoDto) {
    return this.servicio.crear(this.aDatos(dto));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver un pedido' })
  obtener(@Param('id') id: string) {
    return this.servicio.obtener(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar un pedido pendiente' })
  actualizar(@Param('id') id: string, @Body() dto: CrearPedidoDto) {
    return this.servicio.actualizar(id, this.aDatos(dto));
  }

  @Post(':id/entregar')
  @ApiOperation({
    summary:
      'Entregar el pedido: genera la venta (descuenta stock, calcula ganancia y, si es fiado, la deuda) y lo marca entregado',
  })
  entregar(@Param('id') id: string, @Body() dto: EntregarPedidoDto) {
    return this.servicio.entregar(id, {
      clienteId: dto.clienteId,
      montoFiado: dto.montoFiado,
      observaciones: dto.observaciones,
      items: dto.items,
    });
  }

  @Post(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar un pedido pendiente (no toca nada)' })
  cancelar(@Param('id') id: string) {
    return this.servicio.cancelar(id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borrar un pedido pendiente' })
  async eliminar(@Param('id') id: string) {
    await this.servicio.eliminar(id);
  }

  private aDatos(dto: CrearPedidoDto) {
    return {
      clienteId: dto.clienteId,
      nombreContacto: dto.nombreContacto,
      telefono: dto.telefono,
      fechaEntrega: dto.fechaEntrega ? new Date(dto.fechaEntrega) : undefined,
      observaciones: dto.observaciones,
      items: dto.items,
    };
  }
}
