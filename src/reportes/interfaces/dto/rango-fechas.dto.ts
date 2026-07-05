import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class RangoFechasDto {
  @ApiPropertyOptional({
    description: 'Fecha inicial (AAAA-MM-DD). Si falta, no se limita el inicio.',
    example: '2026-07-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha "desde" debe tener formato AAAA-MM-DD' })
  desde?: string;

  @ApiPropertyOptional({
    description: 'Fecha final (AAAA-MM-DD). Si falta, no se limita el final.',
    example: '2026-07-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha "hasta" debe tener formato AAAA-MM-DD' })
  hasta?: string;
}
