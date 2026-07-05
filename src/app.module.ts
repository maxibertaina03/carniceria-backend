import { Module } from '@nestjs/common';
import { CatalogoModule } from './catalogo/catalogo.module';
import { ComprasModule } from './compras/compras.module';
import { ComunModule } from './comun/comun.module';
import { CuentasCorrientesModule } from './cuentas-corrientes/cuentas-corrientes.module';
import { ReportesModule } from './reportes/reportes.module';
import { VentasModule } from './ventas/ventas.module';

@Module({
  imports: [
    ComunModule,
    CatalogoModule,
    ComprasModule,
    VentasModule,
    CuentasCorrientesModule,
    ReportesModule,
  ],
})
export class AppModule {}
