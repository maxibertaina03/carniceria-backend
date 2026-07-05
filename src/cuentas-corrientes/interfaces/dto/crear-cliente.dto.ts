import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearClienteDto {
  @ApiProperty({ description: 'Nombre del cliente', example: 'Juan Pérez' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio' })
  nombre: string;

  @ApiPropertyOptional({ description: 'Teléfono (opcional)', example: '3564-123456' })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  telefono?: string;
}
