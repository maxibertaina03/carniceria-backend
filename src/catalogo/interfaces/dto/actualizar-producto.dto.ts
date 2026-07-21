import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class ActualizarProductoDto {
  @ApiPropertyOptional({ description: 'Nombre del producto' })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del producto no puede estar vacío' })
  nombre?: string;

  @ApiPropertyOptional({ description: 'Categoría', enum: CATEGORIAS_PRODUCTO })
  @IsOptional()
  @IsIn(CATEGORIAS_PRODUCTO, {
    message: `La categoría debe ser una de: ${CATEGORIAS_PRODUCTO.join(', ')}`,
  })
  categoria?: CategoriaProducto;

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
}
