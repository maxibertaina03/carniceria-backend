import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { UNIDADES_MEDIDA, UnidadMedida } from '../../../comun/dominio/unidad-medida';

export class CrearProductoDto {
  @ApiProperty({ description: 'Nombre del producto', example: 'Milanesas' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  nombre: string;

  @ApiProperty({
    description: 'Código de categoría (según el rubro del negocio)',
    example: 'VACUNO',
  })
  // La categoría válida depende del rubro; la valida el servicio contra la config.
  @IsString({ message: 'La categoría debe ser un texto' })
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  categoria: string;

  @ApiPropertyOptional({
    description: 'Subcategoría opcional (ej. base de la milanesa: "Cerdo")',
    example: 'Cerdo',
  })
  @IsOptional()
  @IsString({ message: 'La subcategoría debe ser un texto' })
  subcategoria?: string;

  @ApiPropertyOptional({
    description: 'Unidad de medida (KG por defecto)',
    enum: UNIDADES_MEDIDA,
    default: 'KG',
  })
  @IsOptional()
  @IsIn(UNIDADES_MEDIDA, {
    message: `La unidad de medida debe ser una de: ${UNIDADES_MEDIDA.join(', ')}`,
  })
  unidadMedida?: UnidadMedida;

  @ApiPropertyOptional({
    description: 'Costo unitario inicial de referencia (lo que cuesta comprarlo)',
    example: 5000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El costo unitario debe ser un número' })
  @Min(0, { message: 'El costo unitario no puede ser negativo' })
  costoUnitarioReferencia?: number;

  @ApiPropertyOptional({
    description: 'Precio de venta inicial de referencia',
    example: 7500,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El precio de venta debe ser un número' })
  @Min(0, { message: 'El precio de venta no puede ser negativo' })
  precioVentaReferencia?: number;

  @ApiPropertyOptional({
    description:
      'Si se vende al mostrador (true) o es un insumo/corte interno de producción que no se vende (false). Por defecto true.',
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo "se vende" debe ser verdadero o falso' })
  seVende?: boolean;

  @ApiPropertyOptional({
    description:
      'Cuánto hay hoy de este producto (stock inicial). Por defecto 0.',
    example: 15,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El stock inicial debe ser un número' })
  @Min(0, { message: 'El stock inicial no puede ser negativo' })
  stockInicial?: number;

  @ApiPropertyOptional({
    description:
      'Días que dura desde su elaboración (para lotes con vencimiento). Vacío = no vence.',
    example: 4,
  })
  @IsOptional()
  @IsInt({ message: 'Los días de vencimiento deben ser un número entero' })
  @Min(1, { message: 'Los días de vencimiento deben ser mayor a cero' })
  diasVencimiento?: number;

  @ApiPropertyOptional({ description: 'Foto del producto (data URI base64)' })
  @IsOptional()
  @IsString({ message: 'La imagen debe ser un texto (data URI)' })
  imagen?: string;
}
