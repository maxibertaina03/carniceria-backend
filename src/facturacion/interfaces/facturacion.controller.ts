import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GuardiaAdmin } from '../../comun/seguridad/guardia-admin';
import { ServicioFacturacion } from '../aplicacion/servicio-facturacion';
import { TipoComprobante } from '../dominio/comprobante';
import { CrearComprobanteDto } from './dto/crear-comprobante.dto';

// Todo el módulo de facturación está detrás del candado de administrador.
@ApiTags('Facturación (admin)')
@UseGuards(GuardiaAdmin)
@Controller('facturacion')
export class FacturacionController {
  constructor(private readonly servicio: ServicioFacturacion) {}

  @Get('verificar')
  @ApiOperation({ summary: 'Verifica la contraseña de administrador (para el login)' })
  verificar() {
    return { ok: true };
  }

  @Get('comprobantes')
  @ApiOperation({ summary: 'Listar comprobantes (opcionalmente por tipo)' })
  listar(@Query('tipo') tipo?: TipoComprobante) {
    return this.servicio.listar(tipo);
  }

  @Get('comprobantes/:id')
  @ApiOperation({ summary: 'Ver un comprobante' })
  obtener(@Param('id') id: string) {
    return this.servicio.obtener(id);
  }

  @Post('comprobantes')
  @ApiOperation({ summary: 'Crear un comprobante (factura, nota o recibo)' })
  crear(@Body() dto: CrearComprobanteDto) {
    return this.servicio.crear({
      tipo: dto.tipo,
      letra: dto.letra,
      puntoVenta: dto.puntoVenta,
      fecha: dto.fecha ? new Date(dto.fecha) : undefined,
      receptor: dto.receptor,
      alicuotaIva: dto.alicuotaIva,
      items: dto.items,
      observaciones: dto.observaciones,
      comprobanteOrigenId: dto.comprobanteOrigenId,
    });
  }

  @Post('comprobantes/:id/anular')
  @ApiOperation({ summary: 'Anular un comprobante' })
  anular(@Param('id') id: string) {
    return this.servicio.anular(id);
  }
}
