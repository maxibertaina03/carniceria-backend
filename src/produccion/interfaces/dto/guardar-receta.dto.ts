import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  UNIDADES_MEDIDA,
  UnidadMedida,
} from '../../../comun/dominio/unidad-medida';

export class IngredienteRecetaDto {
  @ApiProperty({ description: 'Id del producto ingrediente (insumo o corte)' })
  @IsString({ message: 'El id del ingrediente debe ser un texto' })
  @IsNotEmpty({ message: 'Cada ingrediente debe indicar un producto' })
  productoId: string;

  @ApiProperty({
    description:
      'Cantidad del ingrediente por el rinde base de la receta, en la unidad de abajo',
    example: 28,
  })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @IsPositive({ message: 'La cantidad debe ser mayor a cero' })
  cantidad: number;

  @ApiPropertyOptional({
    description:
      'Unidad de la cantidad. Puede ser distinta a la del producto si es compatible (ej. GRAMO para una sal que se compra por KG). Si no se envía, se usa la del producto.',
    enum: UNIDADES_MEDIDA,
    example: 'GRAMO',
  })
  @IsOptional()
  @IsIn(UNIDADES_MEDIDA, {
    message: `La unidad debe ser una de: ${UNIDADES_MEDIDA.join(', ')}`,
  })
  unidad?: UnidadMedida;
}

export class GuardarRecetaDto {
  @ApiProperty({ description: 'Id del producto terminado que produce la receta' })
  @IsString({ message: 'El id del producto terminado debe ser un texto' })
  @IsNotEmpty({ message: 'Hay que indicar el producto terminado' })
  productoTerminadoId: string;

  @ApiProperty({
    description: 'Cuánto rinde la fórmula (ej. 10 = produce 10 kg por lote base)',
    example: 10,
  })
  @IsNumber({}, { message: 'El rinde debe ser un número' })
  @IsPositive({ message: 'El rinde debe ser mayor a cero' })
  rindeCantidad: number;

  @ApiProperty({ description: 'Ingredientes de la fórmula', type: [IngredienteRecetaDto] })
  @IsArray({ message: 'Los ingredientes deben ser una lista' })
  @ArrayNotEmpty({ message: 'La receta debe tener al menos un ingrediente' })
  @ValidateNested({ each: true })
  @Type(() => IngredienteRecetaDto)
  ingredientes: IngredienteRecetaDto[];
}
