import { Module } from '@nestjs/common';
import { ActualizadorStockProducto } from '../compras/aplicacion/puertos/actualizador-stock-producto';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { DescontadorStockProducto } from '../ventas/aplicacion/puertos/descontador-stock-producto';
import { AjustadorStockProducto } from './aplicacion/puertos/ajustador-stock-producto';
import { LectorProductosCatalogo } from './aplicacion/puertos/lector-productos-catalogo';
import { ServicioProductos } from './aplicacion/servicio-productos';
import { RepositorioProducto } from './dominio/repositorio-producto';
import { ActualizadorStockProductoCatalogo } from './infraestructura/adaptadores/actualizador-stock-producto-catalogo';
import { AjustadorStockProductoCatalogo } from './infraestructura/adaptadores/ajustador-stock-producto-catalogo';
import { DescontadorStockProductoCatalogo } from './infraestructura/adaptadores/descontador-stock-producto-catalogo';
import { LectorProductosCatalogoPrisma } from './infraestructura/adaptadores/lector-productos-catalogo-prisma';
import { RepositorioProductoPrisma } from './infraestructura/repositorio-producto-prisma';
import { ProductosController } from './interfaces/productos.controller';

@Module({
  imports: [ConfiguracionModule],
  controllers: [ProductosController],
  providers: [
    ServicioProductos,
    { provide: RepositorioProducto, useClass: RepositorioProductoPrisma },
    { provide: LectorProductosCatalogo, useClass: LectorProductosCatalogoPrisma },
    // Adaptadores de los puertos que otros contextos definen sobre el catálogo.
    { provide: ActualizadorStockProducto, useClass: ActualizadorStockProductoCatalogo },
    { provide: DescontadorStockProducto, useClass: DescontadorStockProductoCatalogo },
    { provide: AjustadorStockProducto, useClass: AjustadorStockProductoCatalogo },
  ],
  exports: [
    LectorProductosCatalogo,
    ActualizadorStockProducto,
    DescontadorStockProducto,
    AjustadorStockProducto,
  ],
})
export class CatalogoModule {}
