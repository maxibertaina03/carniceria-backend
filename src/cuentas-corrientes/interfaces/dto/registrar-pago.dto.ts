import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class RegistrarPagoDto {
  @ApiProperty({
    description: 'Monto que entrega el cliente (pago parcial o total)',
    example: 15000,
  })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto del pago debe ser mayor a cero' })
  monto: number;

  @ApiPropertyOptional({ description: 'Observaciones del pago' })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser un texto' })
  observaciones?: string;
}
