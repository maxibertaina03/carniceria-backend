import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CrearGastoDto {
  @ApiProperty({ description: 'Concepto del gasto', example: 'Alquiler' })
  @IsString({ message: 'El concepto debe ser un texto' })
  @IsNotEmpty({ message: 'El concepto es obligatorio' })
  concepto: string;

  @ApiPropertyOptional({ description: 'Categoría (opcional)', example: 'Servicios' })
  @IsOptional()
  @IsString({ message: 'La categoría debe ser un texto' })
  categoria?: string;

  @ApiProperty({ description: 'Monto del gasto', example: 120000 })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto debe ser mayor a cero' })
  monto: number;

  @ApiPropertyOptional({
    description: 'Si queda a deber (true) o se pagó (false). Por defecto false.',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo adeudado debe ser verdadero o falso' })
  adeudado?: boolean;

  @ApiPropertyOptional({
    description: 'Proveedor al que se le debe (obligatorio si es adeudado)',
  })
  @IsOptional()
  @IsString({ message: 'El id del proveedor debe ser un texto' })
  proveedorId?: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser un texto' })
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Fecha del gasto (si no se envía, se usa la fecha actual)',
    example: '2026-07-23',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener formato válido (AAAA-MM-DD)' })
  fecha?: string;
}
