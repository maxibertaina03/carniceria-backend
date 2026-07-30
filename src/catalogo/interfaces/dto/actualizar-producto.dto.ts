import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { UNIDADES_MEDIDA, UnidadMedida } from '../../../comun/dominio/unidad-medida';

export class ActualizarProductoDto {
  @ApiPropertyOptional({ description: 'Nombre del producto' })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del producto no puede estar vacío' })
  nombre?: string;

  @ApiPropertyOptional({ description: 'Código de categoría (según el rubro)' })
  @IsOptional()
  @IsString({ message: 'La categoría debe ser un texto' })
  categoria?: string;

  @ApiPropertyOptional({ description: 'Subcategoría opcional (texto libre)' })
  @IsOptional()
  @IsString({ message: 'La subcategoría debe ser un texto' })
  subcategoria?: string;

  @ApiPropertyOptional({ description: 'Unidad de medida', enum: UNIDADES_MEDIDA })
  @IsOptional()
  @IsIn(UNIDADES_MEDIDA, {
    message: `La unidad de medida debe ser una de: ${UNIDADES_MEDIDA.join(', ')}`,
  })
  unidadMedida?: UnidadMedida;

  @ApiPropertyOptional({ description: 'Costo unitario de referencia' })
  @IsOptional()
  @IsNumber({}, { message: 'El costo unitario debe ser un número' })
  @Min(0, { message: 'El costo unitario no puede ser negativo' })
  costoUnitarioReferencia?: number;

  @ApiPropertyOptional({ description: 'Precio de venta de referencia' })
  @IsOptional()
  @IsNumber({}, { message: 'El precio de venta debe ser un número' })
  @Min(0, { message: 'El precio de venta no puede ser negativo' })
  precioVentaReferencia?: number;

  @ApiPropertyOptional({
    description: 'Si se vende al mostrador (true) o es insumo/corte interno (false)',
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo "se vende" debe ser verdadero o falso' })
  seVende?: boolean;

  @ApiPropertyOptional({
    description: 'Activar (true) o desactivar (false) el producto',
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser verdadero o falso' })
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Días de vencimiento desde la elaboración (null para quitarlo)',
    example: 4,
  })
  @IsOptional()
  // Permite null para borrar el valor; si viene número, debe ser entero > 0.
  @ValidateIf((_, valor) => valor !== null)
  @IsInt({ message: 'Los días de vencimiento deben ser un número entero' })
  @Min(1, { message: 'Los días de vencimiento deben ser mayor a cero' })
  diasVencimiento?: number | null;

  @ApiPropertyOptional({ description: 'Foto (data URI base64); null para quitarla' })
  @IsOptional()
  @ValidateIf((_, valor) => valor !== null)
  @IsString({ message: 'La imagen debe ser un texto (data URI)' })
  imagen?: string | null;
}
