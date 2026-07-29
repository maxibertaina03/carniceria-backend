import { Module } from '@nestjs/common';
import { ActualizadorStockProducto } from '../compras/aplicacion/puertos/actualizador-stock-producto';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { DescontadorStockProducto } from '../ventas/aplicacion/puertos/descontador-stock-producto';
import { ResolvedorPresentaciones } from '../ventas/aplicacion/puertos/resolvedor-presentaciones';
import { AjustadorStockProducto } from './aplicacion/puertos/ajustador-stock-producto';
import { GestorLotes } from './aplicacion/gestor-lotes';
import { LectorProductosCatalogo } from './aplicacion/puertos/lector-productos-catalogo';
import { ServicioPresentaciones } from './aplicacion/servicio-presentaciones';
import { ServicioProductos } from './aplicacion/servicio-productos';
import { RepositorioLote } from './dominio/repositorio-lote';
import { RepositorioPresentacion } from './dominio/repositorio-presentacion';
import { RepositorioProducto } from './dominio/repositorio-producto';
import { ActualizadorStockProductoCatalogo } from './infraestructura/adaptadores/actualizador-stock-producto-catalogo';
import { AjustadorStockProductoCatalogo } from './infraestructura/adaptadores/ajustador-stock-producto-catalogo';
import { DescontadorStockProductoCatalogo } from './infraestructura/adaptadores/descontador-stock-producto-catalogo';
import { LectorProductosCatalogoPrisma } from './infraestructura/adaptadores/lector-productos-catalogo-prisma';
import { ResolvedorPresentacionesCatalogo } from './infraestructura/adaptadores/resolvedor-presentaciones-catalogo';
import { RepositorioLotePrisma } from './infraestructura/repositorio-lote-prisma';
import { RepositorioPresentacionPrisma } from './infraestructura/repositorio-presentacion-prisma';
import { RepositorioProductoPrisma } from './infraestructura/repositorio-producto-prisma';
import { PresentacionesController } from './interfaces/presentaciones.controller';
import { ProductosController } from './interfaces/productos.controller';

@Module({
  imports: [ConfiguracionModule],
  controllers: [ProductosController, PresentacionesController],
  providers: [
    ServicioProductos,
    ServicioPresentaciones,
    GestorLotes,
    { provide: RepositorioProducto, useClass: RepositorioProductoPrisma },
    { provide: RepositorioLote, useClass: RepositorioLotePrisma },
    { provide: RepositorioPresentacion, useClass: RepositorioPresentacionPrisma },
    { provide: LectorProductosCatalogo, useClass: LectorProductosCatalogoPrisma },
    // Adaptadores de los puertos que otros contextos definen sobre el catálogo.
    { provide: ActualizadorStockProducto, useClass: ActualizadorStockProductoCatalogo },
    { provide: DescontadorStockProducto, useClass: DescontadorStockProductoCatalogo },
    { provide: AjustadorStockProducto, useClass: AjustadorStockProductoCatalogo },
    { provide: ResolvedorPresentaciones, useClass: ResolvedorPresentacionesCatalogo },
  ],
  exports: [
    LectorProductosCatalogo,
    ActualizadorStockProducto,
    DescontadorStockProducto,
    AjustadorStockProducto,
    ResolvedorPresentaciones,
  ],
})
export class CatalogoModule {}
