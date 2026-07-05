import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { ConsultaCompras } from './aplicacion/puertos/consulta-compras';
import { ServicioCompras } from './aplicacion/servicio-compras';
import { RepositorioCompra } from './dominio/repositorio-compra';
import { ConsultaComprasPrisma } from './infraestructura/consulta-compras-prisma';
import { RepositorioCompraPrisma } from './infraestructura/repositorio-compra-prisma';
import { ComprasController } from './interfaces/compras.controller';

@Module({
  imports: [CatalogoModule],
  controllers: [ComprasController],
  providers: [
    ServicioCompras,
    { provide: RepositorioCompra, useClass: RepositorioCompraPrisma },
    { provide: ConsultaCompras, useClass: ConsultaComprasPrisma },
  ],
})
export class ComprasModule {}
