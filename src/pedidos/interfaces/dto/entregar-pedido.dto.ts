import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ItemEntregaDto {
  @ApiProperty({ description: 'Id del producto' })
  @IsString({ message: 'El id del producto debe ser un texto' })
  @IsNotEmpty({ message: 'Cada línea debe indicar un producto' })
  productoId: string;

  @ApiProperty({ description: 'Cantidad real entregada (peso real)', example: 1.2 })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @IsPositive({ message: 'La cantidad debe ser mayor a cero' })
  cantidad: number;

  @ApiProperty({ description: 'Precio por unidad de venta', example: 14000 })
  @IsNumber({}, { message: 'El precio de venta debe ser un número' })
  @Min(0, { message: 'El precio de venta no puede ser negativo' })
  precioUnitarioVenta: number;
}

export class EntregarPedidoDto {
  @ApiPropertyOptional({
    description: 'Cliente al que se le fía (si el pedido no tenía uno)',
  })
  @IsOptional()
  @IsString({ message: 'El id del cliente debe ser un texto' })
  clienteId?: string;

  @ApiPropertyOptional({
    description: 'Cuánto queda fiado (0 = paga todo al contado)',
    example: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El monto fiado debe ser un número' })
  @Min(0, { message: 'El monto fiado no puede ser negativo' })
  montoFiado?: number;

  @ApiPropertyOptional({ description: 'Observaciones de la venta' })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser un texto' })
  observaciones?: string;

  @ApiPropertyOptional({
    description:
      'Cantidades y precios reales confirmados (peso real). Si no se envían, se usan los del pedido.',
    type: [ItemEntregaDto],
  })
  @IsOptional()
  @IsArray({ message: 'Los items deben ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => ItemEntregaDto)
  items?: ItemEntregaDto[];
}
