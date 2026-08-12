import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ConsultaDto {
  @ApiProperty({
    description: 'La pregunta del dueño, en lenguaje natural.',
    example: '¿Cuánto vendí ayer?',
  })
  @IsString()
  @IsNotEmpty({ message: 'La pregunta no puede estar vacía.' })
  @MaxLength(500, { message: 'La pregunta es demasiado larga.' })
  pregunta: string;
}
