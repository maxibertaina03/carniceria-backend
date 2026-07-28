import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

// Header por donde el admin manda su contraseña.
export const HEADER_ADMIN = 'x-admin-clave';

// Candado del área de administrador (facturación y futuras funciones internas).
// A diferencia de la clave de la app (que viaja embebida en el frontend), esta
// contraseña la escribe el administrador y NO está en el código de la app, así
// que la familia no la tiene. Se compara contra la variable ADMIN_CLAVE.
//
// Por seguridad, si ADMIN_CLAVE no está configurada, el área queda CERRADA
// (no abierta): en producción hay que configurarla sí o sí.
@Injectable()
export class GuardiaAdmin implements CanActivate {
  canActivate(contexto: ExecutionContext): boolean {
    const claveEsperada = process.env.ADMIN_CLAVE?.trim();
    if (!claveEsperada) {
      throw new ForbiddenException(
        'El área de administrador no está configurada en el servidor.',
      );
    }

    const request = contexto.switchToHttp().getRequest<Request>();
    if (request.method === 'OPTIONS') {
      return true;
    }

    const claveRecibida = request.header(HEADER_ADMIN);
    if (claveRecibida && claveRecibida === claveEsperada) {
      return true;
    }
    throw new UnauthorizedException('Contraseña de administrador incorrecta.');
  }
}
