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
  Min,
  ValidateNested,
} from 'class-validator';

export class ItemPedidoDto {
  @ApiProperty({ description: 'Id del producto encargado' })
  @IsString({ message: 'El id del producto debe ser un texto' })
  @IsNotEmpty({ message: 'Cada línea del pedido debe indicar un producto' })
  productoId: string;

  @ApiProperty({ description: 'Cantidad estimada (se confirma al entregar)', example: 1 })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @IsPositive({ message: 'La cantidad debe ser mayor a cero' })
  cantidad: number;

  @ApiPropertyOptional({ description: 'Precio por unidad acordado', example: 14000 })
  @IsOptional()
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  precioUnitario?: number;
}

export class CrearPedidoDto {
  @ApiPropertyOptional({ description: 'Id del cliente (si está registrado)' })
  @IsOptional()
  @IsString({ message: 'El id del cliente debe ser un texto' })
  clienteId?: string;

  @ApiPropertyOptional({
    description: 'Nombre de para quién es (si no es un cliente registrado)',
    example: 'Juan',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  nombreContacto?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Fecha para la que se necesita (AAAA-MM-DD)',
    example: '2026-07-25',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de entrega debe tener formato AAAA-MM-DD' })
  fechaEntrega?: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser un texto' })
  observaciones?: string;

  @ApiProperty({ description: 'Productos encargados', type: [ItemPedidoDto] })
  @IsArray({ message: 'Los productos deben ser una lista' })
  @ArrayNotEmpty({ message: 'El pedido debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  items: ItemPedidoDto[];
}
