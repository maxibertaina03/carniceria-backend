import { Injectable } from '@nestjs/common';
import { ServicioConfiguracion } from '../aplicacion/servicio-configuracion';
import { LectorConfiguracion } from '../aplicacion/puertos/lector-configuracion';
import { FeaturesNegocio } from '../dominio/configuracion-negocio';

// Adaptador del puerto LectorConfiguracion sobre la config del negocio activo.
@Injectable()
export class LectorConfiguracionNegocio extends LectorConfiguracion {
  constructor(private readonly servicio: ServicioConfiguracion) {
    super();
  }

  nombreNegocio(): string {
    return this.servicio.obtener().nombreNegocio;
  }

  categoriasValidas(): string[] {
    return this.servicio.obtener().categorias.map((c) => c.codigo);
  }

  categoriasProducibles(): string[] {
    return this.servicio
      .obtener()
      .categorias.filter((c) => c.producible)
      .map((c) => c.codigo);
  }

  features(): FeaturesNegocio {
    return this.servicio.obtener().features;
  }
}
