import { Module } from '@nestjs/common';
import { RegistradorDeudaProveedor } from './aplicacion/puertos/registrador-deuda-proveedor';
import { ServicioProveedores } from './aplicacion/servicio-proveedores';
import { RepositorioProveedor } from './dominio/repositorio-proveedor';
import { RegistradorDeudaProveedorProveedores } from './infraestructura/adaptadores/registrador-deuda-proveedor-proveedores';
import { RepositorioProveedorPrisma } from './infraestructura/repositorio-proveedor-prisma';
import { ProveedoresController } from './interfaces/proveedores.controller';

@Module({
  controllers: [ProveedoresController],
  providers: [
    ServicioProveedores,
    { provide: RepositorioProveedor, useClass: RepositorioProveedorPrisma },
    // Puerto que usan Compras y Gastos para registrar/revertir deudas propias.
    { provide: RegistradorDeudaProveedor, useClass: RegistradorDeudaProveedorProveedores },
  ],
  exports: [RegistradorDeudaProveedor],
})
export class ProveedoresModule {}
