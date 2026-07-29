import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ItemVentaDto {
  @ApiPropertyOptional({
    description:
      'Id del producto vendido. Obligatorio salvo que se venda por presentación.',
  })
  @IsOptional()
  @IsString({ message: 'El id del producto debe ser un texto' })
  productoId?: string;

  @ApiPropertyOptional({
    description:
      'Id de la presentación vendida (½ kg, docena…). Si viene, se usa en lugar de producto/precio.',
  })
  @IsOptional()
  @IsString({ message: 'El id de la presentación debe ser un texto' })
  presentacionId?: string;

  @ApiProperty({
    description: 'Cantidad vendida (en unidades del producto, o de la presentación)',
    example: 1.5,
  })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @IsPositive({ message: 'La cantidad debe ser mayor a cero' })
  cantidad: number;

  @ApiPropertyOptional({
    description:
      'Precio de venta por unidad del producto (no se usa si se vende por presentación)',
    example: 7500,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El precio de venta debe ser un número' })
  @Min(0, { message: 'El precio de venta no puede ser negativo' })
  precioUnitarioVenta?: number;
}

export class RegistrarVentaDto {
  @ApiPropertyOptional({
    description:
      'Id del cliente. Opcional para ventas al contado (consumidor final); obligatorio si hay monto fiado.',
  })
  @IsOptional()
  @IsString({ message: 'El id del cliente debe ser un texto' })
  clienteId?: string;

  @ApiPropertyOptional({
    description:
      'Cuánto queda fiado: 0 o ausente = contado; igual al total = todo fiado; un valor intermedio = pago mixto.',
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
    description: 'Fecha de la venta (si no se envía, se usa la fecha actual)',
    example: '2026-07-04',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener formato válido (AAAA-MM-DD)' })
  fecha?: string;

  @ApiProperty({ description: 'Líneas de la venta', type: [ItemVentaDto] })
  @IsArray({ message: 'Los items deben ser una lista' })
  @ArrayNotEmpty({ message: 'La venta debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => ItemVentaDto)
  items: ItemVentaDto[];
}
