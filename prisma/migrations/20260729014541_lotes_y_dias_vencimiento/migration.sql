-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "dias_vencimiento" INTEGER;

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "fecha_elaboracion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" TIMESTAMP(3),
    "cantidad_inicial" DECIMAL(12,3) NOT NULL,
    "cantidad_disponible" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lotes_producto_id_cantidad_disponible_idx" ON "lotes"("producto_id", "cantidad_disponible");

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
