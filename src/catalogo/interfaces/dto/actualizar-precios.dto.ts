import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ActualizarPreciosDto {
  @ApiProperty({
    description: 'Porcentaje: 10 = +10%, -5 = -5%',
    example: 10,
  })
  @IsNumber({}, { message: 'El porcentaje debe ser un número' })
  @Min(-90, { message: 'El porcentaje no puede ser tan negativo' })
  @Max(1000, { message: 'El porcentaje es demasiado alto' })
  porcentaje: number;

  @ApiPropertyOptional({
    description: 'Categorías a las que aplicar (vacío = todas)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categorias?: string[];

  @ApiPropertyOptional({
    description: 'Redondear el precio nuevo (10/50/100). 0 = sin redondear.',
    example: 10,
  })
  @IsOptional()
  @IsIn([0, 10, 50, 100], { message: 'El redondeo debe ser 0, 10, 50 o 100' })
  redondearA?: number;

  @ApiPropertyOptional({ description: 'Actualizar también las presentaciones' })
  @IsOptional()
  @IsBoolean()
  incluirPresentaciones?: boolean;
}
