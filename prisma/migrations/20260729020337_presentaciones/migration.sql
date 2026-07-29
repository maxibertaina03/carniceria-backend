-- CreateTable
CREATE TABLE "presentaciones" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad_equivalente" DECIMAL(12,3) NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "presentaciones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "presentaciones" ADD CONSTRAINT "presentaciones_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
