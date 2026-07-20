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
  ValidateNested,
} from 'class-validator';

export class CorteDesposteDto {
  @ApiProperty({ description: 'Id del producto/corte que sale de la res' })
  @IsString({ message: 'El id del corte debe ser un texto' })
  @IsNotEmpty({ message: 'Cada corte debe indicar un producto' })
  productoId: string;

  @ApiProperty({ description: 'Kilos obtenidos de este corte', example: 10 })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @IsPositive({ message: 'La cantidad debe ser mayor a cero' })
  cantidad: number;

  @ApiProperty({
    description:
      'Valor por kg que le asignás al corte (ej. su precio de venta). Reparte el costo de la res.',
    example: 8000,
  })
  @IsNumber({}, { message: 'El valor por kg debe ser un número' })
  @IsPositive({ message: 'El valor por kg debe ser mayor a cero' })
  valorReferencia: number;
}

export class RegistrarDesposteDto {
  @ApiPropertyOptional({ description: 'Proveedor de la media res (texto libre)' })
  @IsOptional()
  @IsString({ message: 'El proveedor debe ser un texto' })
  proveedor?: string;

  @ApiProperty({ description: 'Peso total de la media res en kg', example: 100 })
  @IsNumber({}, { message: 'El peso de la res debe ser un número' })
  @IsPositive({ message: 'El peso de la res debe ser mayor a cero' })
  pesoRes: number;

  @ApiProperty({ description: 'Costo total pagado por la media res', example: 500000 })
  @IsNumber({}, { message: 'El costo total debe ser un número' })
  @IsPositive({ message: 'El costo total debe ser mayor a cero' })
  costoTotal: number;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser un texto' })
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Fecha del desposte (si no se envía, se usa la fecha actual)',
    example: '2026-07-20',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener formato válido (AAAA-MM-DD)' })
  fecha?: string;

  @ApiProperty({ description: 'Cortes obtenidos', type: [CorteDesposteDto] })
  @IsArray({ message: 'Los cortes deben ser una lista' })
  @ArrayNotEmpty({ message: 'El desposte debe tener al menos un corte' })
  @ValidateNested({ each: true })
  @Type(() => CorteDesposteDto)
  cortes: CorteDesposteDto[];
}
