import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ActualizarClienteDto {
  @ApiPropertyOptional({ description: 'Nombre del cliente' })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del cliente no puede estar vacío' })
  nombre?: string;

  @ApiPropertyOptional({ description: 'Teléfono' })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Activar (true) o desactivar (false) el cliente. Solo se puede desactivar sin deuda pendiente.',
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser verdadero o falso' })
  activo?: boolean;
}
