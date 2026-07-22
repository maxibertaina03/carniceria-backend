import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class AjustarStockDto {
  @ApiProperty({
    description:
      'Cantidad real que hay del producto (reemplaza el stock actual, no se suma)',
    example: 12.5,
  })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  cantidad: number;
}
