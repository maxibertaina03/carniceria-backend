import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { GuardiaClaveApi } from './comun/seguridad/guardia-clave-api';
import { CatalogoModule } from './catalogo/catalogo.module';
import { ComprasModule } from './compras/compras.module';
import { ComunModule } from './comun/comun.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { CuentasCorrientesModule } from './cuentas-corrientes/cuentas-corrientes.module';
import { DesposteModule } from './desposte/desposte.module';
import { FacturacionModule } from './facturacion/facturacion.module';
import { GastosModule } from './gastos/gastos.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { ProduccionModule } from './produccion/produccion.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { ReportesModule } from './reportes/reportes.module';
import { VentasModule } from './ventas/ventas.module';

@Module({
  imports: [
    ComunModule,
    ConfiguracionModule,
    CatalogoModule,
    ComprasModule,
    VentasModule,
    CuentasCorrientesModule,
    ProveedoresModule,
    GastosModule,
    DesposteModule,
    ProduccionModule,
    PedidosModule,
    ReportesModule,
    FacturacionModule,
  ],
  controllers: [AppController],
  // Guardia global: exige la clave compartida en todos los endpoints
  // (salvo los marcados como públicos, como el chequeo de salud).
  providers: [{ provide: APP_GUARD, useClass: GuardiaClaveApi }],
})
export class AppModule {}
