import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class RegistrarProduccionDto {
  @ApiProperty({ description: 'Id del producto terminado a producir' })
  @IsString({ message: 'El id del producto debe ser un texto' })
  @IsNotEmpty({ message: 'Hay que indicar qué producto se produce' })
  productoTerminadoId: string;

  @ApiProperty({ description: 'Cuánto se produce (en la unidad del producto)', example: 30 })
  @IsNumber({}, { message: 'La cantidad a producir debe ser un número' })
  @IsPositive({ message: 'La cantidad a producir debe ser mayor a cero' })
  cantidadProducida: number;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser un texto' })
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Fecha de la producción (si no se envía, se usa la fecha actual)',
    example: '2026-07-20',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener formato válido (AAAA-MM-DD)' })
  fecha?: string;
}
