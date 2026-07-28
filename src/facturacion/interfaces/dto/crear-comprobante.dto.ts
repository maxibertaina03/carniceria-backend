import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { TipoComprobante } from '../../dominio/comprobante';

const TIPOS: TipoComprobante[] = [
  'FACTURA',
  'NOTA_CREDITO',
  'NOTA_DEBITO',
  'RECIBO',
];

export class ReceptorDto {
  @ApiProperty({ description: 'Nombre o razón social del cliente' })
  @IsString({ message: 'El nombre del cliente debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio' })
  nombre: string;

  @ApiPropertyOptional({ description: 'Tipo de documento (CUIT, DNI, etc.)' })
  @IsOptional()
  @IsString()
  docTipo?: string;

  @ApiPropertyOptional({ description: 'Número de documento' })
  @IsOptional()
  @IsString()
  docNumero?: string;

  @ApiPropertyOptional({ description: 'Domicilio del cliente' })
  @IsOptional()
  @IsString()
  domicilio?: string;
}

export class ItemComprobanteDto {
  @ApiProperty({ description: 'Descripción del ítem' })
  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción del ítem es obligatoria' })
  descripcion: string;

  @ApiProperty({ description: 'Cantidad', example: 2 })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0.001, { message: 'La cantidad debe ser mayor a cero' })
  cantidad: number;

  @ApiProperty({ description: 'Precio unitario', example: 1500 })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  precioUnitario: number;
}

export class CrearComprobanteDto {
  @ApiProperty({ enum: TIPOS })
  @IsEnum(TIPOS, { message: 'Tipo de comprobante inválido' })
  tipo: TipoComprobante;

  @ApiPropertyOptional({ description: 'Letra (por defecto X = interno)' })
  @IsOptional()
  @IsString()
  letra?: string;

  @ApiPropertyOptional({ description: 'Punto de venta (por defecto 0001)' })
  @IsOptional()
  @IsString()
  puntoVenta?: string;

  @ApiPropertyOptional({ description: 'Fecha (por defecto hoy)', example: '2026-07-24' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener formato AAAA-MM-DD' })
  fecha?: string;

  @ApiProperty({ type: ReceptorDto })
  @ValidateNested()
  @Type(() => ReceptorDto)
  receptor: ReceptorDto;

  @ApiPropertyOptional({ description: 'Alícuota de IVA (%). 0 = sin IVA', example: 21 })
  @IsOptional()
  @IsNumber({}, { message: 'La alícuota debe ser un número' })
  @Min(0)
  @Max(100)
  alicuotaIva?: number;

  @ApiProperty({ type: [ItemComprobanteDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'El comprobante necesita al menos un ítem' })
  @ValidateNested({ each: true })
  @Type(() => ItemComprobanteDto)
  items: ItemComprobanteDto[];

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Factura de origen (obligatorio para notas de crédito/débito)',
  })
  @IsOptional()
  @IsString()
  comprobanteOrigenId?: string;
}
