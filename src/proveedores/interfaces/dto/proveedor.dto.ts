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

export class CrearProveedorDto {
  @ApiProperty({ description: 'Nombre del proveedor', example: 'Frigorífico San José' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del proveedor es obligatorio' })
  nombre: string;

  @ApiPropertyOptional({ description: 'Teléfono (opcional)' })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Deuda que ya se le tenía al proveedor al empezar (opcional)',
    example: 50000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La deuda inicial debe ser un número' })
  @Min(0, { message: 'La deuda inicial no puede ser negativa' })
  deudaInicial?: number;
}

export class ActualizarProveedorDto {
  @ApiPropertyOptional({ description: 'Nombre del proveedor' })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  nombre?: string;

  @ApiPropertyOptional({ description: 'Teléfono' })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  telefono?: string;

  @ApiPropertyOptional({ description: 'Activar (true) o desactivar (false)' })
  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser verdadero o falso' })
  activo?: boolean;
}

export class RegistrarPagoProveedorDto {
  @ApiProperty({ description: 'Monto que le pagás al proveedor', example: 50000 })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto del pago debe ser mayor a cero' })
  monto: number;

  @ApiPropertyOptional({ description: 'Observaciones del pago' })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser un texto' })
  observaciones?: string;
}
