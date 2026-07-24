import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ES_PUBLICO } from './publico.decorator';

// Nombre del header donde la app manda la clave compartida.
export const HEADER_CLAVE = 'x-clave-api';

// Guardia simple de clave compartida: la app manda la misma clave en cada
// pedido. No hay usuarios ni login. Si la variable CLAVE_API no está
// configurada, el sistema queda abierto (útil en desarrollo local); en
// producción se configura la clave y ahí queda protegido.
@Injectable()
export class GuardiaClaveApi implements CanActivate {
  private readonly logger = new Logger(GuardiaClaveApi.name);
  private avisoSinClaveMostrado = false;

  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const claveEsperada = process.env.CLAVE_API?.trim();

    // Sin clave configurada: no se exige nada (modo desarrollo / sin proteger).
    if (!claveEsperada) {
      if (!this.avisoSinClaveMostrado) {
        this.logger.warn(
          'CLAVE_API no está configurada: la API queda abierta sin protección.',
        );
        this.avisoSinClaveMostrado = true;
      }
      return true;
    }

    // Rutas marcadas como públicas (ej. chequeo de salud) no piden clave.
    const esPublico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (esPublico) {
      return true;
    }

    const request = contexto.switchToHttp().getRequest<Request>();

    // El navegador manda OPTIONS antes del pedido real (preflight de CORS):
    // no lleva la clave y hay que dejarlo pasar.
    if (request.method === 'OPTIONS') {
      return true;
    }

    const claveRecibida = request.header(HEADER_CLAVE);
    if (claveRecibida && claveRecibida === claveEsperada) {
      return true;
    }

    throw new UnauthorizedException('Clave de acceso inválida o faltante.');
  }
}
