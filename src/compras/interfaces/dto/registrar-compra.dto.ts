import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ItemCompraDto {
  @ApiProperty({ description: 'Id del producto comprado' })
  @IsString({ message: 'El id del producto debe ser un texto' })
  @IsNotEmpty({ message: 'Cada línea de la compra debe indicar un producto' })
  productoId: string;

  @ApiProperty({ description: 'Cantidad comprada (en la unidad del producto)', example: 25.5 })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @IsPositive({ message: 'La cantidad debe ser mayor a cero' })
  cantidad: number;

  @ApiProperty({ description: 'Costo pagado por unidad (por kg o por unidad)', example: 5200 })
  @IsNumber({}, { message: 'El costo unitario debe ser un número' })
  @Min(0, { message: 'El costo unitario no puede ser negativo' })
  costoUnitario: number;
}

export class RegistrarCompraDto {
  @ApiPropertyOptional({ description: 'Nombre del proveedor (texto libre)', example: 'Frigorífico San José' })
  @IsOptional()
  @IsString({ message: 'El proveedor debe ser un texto' })
  proveedor?: string;

  @ApiPropertyOptional({
    description: 'Id del proveedor con cuenta (obligatorio si algo queda a deber)',
  })
  @IsOptional()
  @IsString({ message: 'El id del proveedor debe ser un texto' })
  proveedorId?: string;

  @ApiPropertyOptional({
    description: 'Cuánto queda a deber (0 = paga todo; igual al total = todo a deber)',
    example: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El monto adeudado debe ser un número' })
  @Min(0, { message: 'El monto adeudado no puede ser negativo' })
  montoAdeudado?: number;

  @ApiPropertyOptional({ description: 'Observaciones de la compra' })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser un texto' })
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Fecha de la compra (si no se envía, se usa la fecha actual)',
    example: '2026-07-04',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener formato válido (AAAA-MM-DD)' })
  fecha?: string;

  @ApiProperty({ description: 'Líneas de la compra', type: [ItemCompraDto] })
  @IsArray({ message: 'Los items deben ser una lista' })
  @ArrayNotEmpty({ message: 'La compra debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => ItemCompraDto)
  items: ItemCompraDto[];
}
