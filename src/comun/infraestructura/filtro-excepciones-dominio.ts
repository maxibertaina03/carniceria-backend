import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { ExcepcionDominio } from '../dominio/excepcion-dominio';

// Convierte las excepciones de negocio en respuestas HTTP con mensaje en español.
@Catch(ExcepcionDominio)
export class FiltroExcepcionesDominio implements ExceptionFilter {
  catch(excepcion: ExcepcionDominio, host: ArgumentsHost) {
    const respuesta = host.switchToHttp().getResponse<Response>();
    respuesta.status(excepcion.codigoHttp).json({
      statusCode: excepcion.codigoHttp,
      error: excepcion.name,
      mensaje: excepcion.message,
    });
  }
}
