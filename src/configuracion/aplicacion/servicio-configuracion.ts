import { Injectable } from '@nestjs/common';
import { ConfiguracionNegocio } from '../dominio/configuracion-negocio';
import { resolverConfiguracion } from '../dominio/rubros';

@Injectable()
export class ServicioConfiguracion {
  // Config activa según la variable de entorno RUBRO (default: carnicería).
  obtener(): ConfiguracionNegocio {
    return resolverConfiguracion(process.env.RUBRO);
  }
}
