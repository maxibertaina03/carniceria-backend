-- AlterEnum
ALTER TYPE "categoria_producto" ADD VALUE 'INSUMOS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "unidad_medida" ADD VALUE 'GRAMO';
ALTER TYPE "unidad_medida" ADD VALUE 'METRO';

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "se_vende" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "despostes" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proveedor" TEXT,
    "peso_res" DECIMAL(12,3) NOT NULL,
    "costo_total" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,

    CONSTRAINT "despostes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_desposte" (
    "id" TEXT NOT NULL,
    "desposte_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "valor_referencia" DECIMAL(12,2) NOT NULL,
    "costo_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "items_desposte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recetas" (
    "id" TEXT NOT NULL,
    "producto_terminado_id" TEXT NOT NULL,
    "rinde_cantidad" DECIMAL(12,3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "recetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredientes_receta" (
    "id" TEXT NOT NULL,
    "receta_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "ingredientes_receta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_produccion" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "producto_terminado_id" TEXT NOT NULL,
    "cantidad_producida" DECIMAL(12,3) NOT NULL,
    "costo_total" DECIMAL(12,2) NOT NULL,
    "costo_unitario" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,

    CONSTRAINT "ordenes_produccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_produccion" (
    "id" TEXT NOT NULL,
    "orden_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "costo_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "items_produccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recetas_producto_terminado_id_key" ON "recetas"("producto_terminado_id");

-- AddForeignKey
ALTER TABLE "items_desposte" ADD CONSTRAINT "items_desposte_desposte_id_fkey" FOREIGN KEY ("desposte_id") REFERENCES "despostes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_desposte" ADD CONSTRAINT "items_desposte_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_producto_terminado_id_fkey" FOREIGN KEY ("producto_terminado_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredientes_receta" ADD CONSTRAINT "ingredientes_receta_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "recetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredientes_receta" ADD CONSTRAINT "ingredientes_receta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_producto_terminado_id_fkey" FOREIGN KEY ("producto_terminado_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_produccion" ADD CONSTRAINT "items_produccion_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ordenes_produccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_produccion" ADD CONSTRAINT "items_produccion_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
