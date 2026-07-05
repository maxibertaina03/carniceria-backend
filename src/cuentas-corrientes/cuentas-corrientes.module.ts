import { Module } from '@nestjs/common';
import { RegistradorDeudaCliente } from '../ventas/aplicacion/puertos/registrador-deuda-cliente';
import { ServicioClientes } from './aplicacion/servicio-clientes';
import { RepositorioCliente } from './dominio/repositorio-cliente';
import { RegistradorDeudaClienteCuentas } from './infraestructura/adaptadores/registrador-deuda-cliente-cuentas';
import { RepositorioClientePrisma } from './infraestructura/repositorio-cliente-prisma';
import { ClientesController } from './interfaces/clientes.controller';

@Module({
  controllers: [ClientesController],
  providers: [
    ServicioClientes,
    { provide: RepositorioCliente, useClass: RepositorioClientePrisma },
    // Adaptador del puerto que define Ventas sobre las cuentas corrientes.
    { provide: RegistradorDeudaCliente, useClass: RegistradorDeudaClienteCuentas },
  ],
  exports: [RegistradorDeudaCliente],
})
export class CuentasCorrientesModule {}
