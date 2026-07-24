import { Injectable } from '@nestjs/common';
import { ConsultasReportes, RangoFechas } from './puertos/consultas-reportes';

@Injectable()
export class ServicioReportes {
  constructor(private readonly consultas: ConsultasReportes) {}

  ganancias(desde?: string, hasta?: string) {
    return this.consultas.ganancias(this.aRango(desde, hasta));
  }

  productosMasVendidos(desde?: string, hasta?: string) {
    return this.consultas.productosMasVendidos(this.aRango(desde, hasta));
  }

  deudas() {
    return this.consultas.deudas();
  }

  resumenInicio() {
    return this.consultas.resumenInicio();
  }

  stock() {
    return this.consultas.stock();
  }

  // Convierte fechas "AAAA-MM-DD" en un rango que cubre los días completos
  // (desde las 00:00 del primer día hasta las 23:59 del último).
  private aRango(desde?: string, hasta?: string): RangoFechas {
    return {
      desde: desde ? new Date(`${desde}T00:00:00`) : undefined,
      hasta: hasta ? new Date(`${hasta}T23:59:59.999`) : undefined,
    };
  }
}
