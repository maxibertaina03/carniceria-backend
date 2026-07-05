import { Module } from '@nestjs/common';
import { ActualizadorStockProducto } from '../compras/aplicacion/puertos/actualizador-stock-producto';
import { DescontadorStockProducto } from '../ventas/aplicacion/puertos/descontador-stock-producto';
import { LectorProductosCatalogo } from './aplicacion/puertos/lector-productos-catalogo';
import { ServicioProductos } from './aplicacion/servicio-productos';
import { RepositorioProducto } from './dominio/repositorio-producto';
import { ActualizadorStockProductoCatalogo } from './infraestructura/adaptadores/actualizador-stock-producto-catalogo';
import { DescontadorStockProductoCatalogo } from './infraestructura/adaptadores/descontador-stock-producto-catalogo';
import { LectorProductosCatalogoPrisma } from './infraestructura/adaptadores/lector-productos-catalogo-prisma';
import { RepositorioProductoPrisma } from './infraestructura/repositorio-producto-prisma';
import { ProductosController } from './interfaces/productos.controller';

@Module({
  controllers: [ProductosController],
  providers: [
    ServicioProductos,
    { provide: RepositorioProducto, useClass: RepositorioProductoPrisma },
    { provide: LectorProductosCatalogo, useClass: LectorProductosCatalogoPrisma },
    // Adaptadores de los puertos que otros contextos definen sobre el catálogo.
    { provide: ActualizadorStockProducto, useClass: ActualizadorStockProductoCatalogo },
    { provide: DescontadorStockProducto, useClass: DescontadorStockProductoCatalogo },
  ],
  exports: [LectorProductosCatalogo, ActualizadorStockProducto, DescontadorStockProducto],
})
export class CatalogoModule {}
