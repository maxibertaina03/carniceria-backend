import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CrearPresentacionDto {
  @ApiProperty({ description: 'Producto base al que pertenece' })
  @IsString()
  @IsNotEmpty({ message: 'Falta el producto de la presentación' })
  productoId: string;

  @ApiProperty({ description: 'Nombre de la presentación', example: 'Docena' })
  @IsString()
  @IsNotEmpty({ message: 'La presentación necesita un nombre' })
  nombre: string;

  @ApiProperty({
    description: 'Cuánto del stock base equivale una presentación',
    example: 0.6,
  })
  @IsNumber({}, { message: 'La cantidad equivalente debe ser un número' })
  @IsPositive({ message: 'La cantidad equivalente debe ser mayor a cero' })
  cantidadEquivalente: number;

  @ApiProperty({ description: 'Precio de la presentación', example: 3000 })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  precio: number;
}

export class ActualizarPresentacionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({}, { message: 'La cantidad equivalente debe ser un número' })
  @IsPositive({ message: 'La cantidad equivalente debe ser mayor a cero' })
  cantidadEquivalente?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  precio?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
