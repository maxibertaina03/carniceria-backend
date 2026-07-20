import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { UNIDADES_MEDIDA, UnidadMedida } from '../../../comun/dominio/unidad-medida';
import { CATEGORIAS_PRODUCTO, CategoriaProducto } from '../../dominio/categoria-producto';

export class CrearProductoDto {
  @ApiProperty({ description: 'Nombre del producto', example: 'Milanesas' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  nombre: string;

  @ApiProperty({
    description: 'Categoría del producto',
    enum: CATEGORIAS_PRODUCTO,
    example: 'VACUNO',
  })
  @IsIn(CATEGORIAS_PRODUCTO, {
    message: `La categoría debe ser una de: ${CATEGORIAS_PRODUCTO.join(', ')}`,
  })
  categoria: CategoriaProducto;

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
}
