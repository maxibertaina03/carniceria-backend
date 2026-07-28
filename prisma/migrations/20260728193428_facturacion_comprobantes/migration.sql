-- CreateEnum
CREATE TYPE "tipo_comprobante" AS ENUM ('FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO', 'RECIBO');

-- CreateEnum
CREATE TYPE "estado_comprobante" AS ENUM ('EMITIDO', 'ANULADO');

-- CreateTable
CREATE TABLE "comprobantes" (
    "id" TEXT NOT NULL,
    "tipo" "tipo_comprobante" NOT NULL,
    "letra" TEXT NOT NULL DEFAULT 'X',
    "punto_venta" TEXT NOT NULL DEFAULT '0001',
    "numero" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receptor_nombre" TEXT NOT NULL,
    "receptor_doc_tipo" TEXT,
    "receptor_doc_numero" TEXT,
    "receptor_domicilio" TEXT,
    "neto" DECIMAL(12,2) NOT NULL,
    "alicuota_iva" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "iva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,
    "estado" "estado_comprobante" NOT NULL DEFAULT 'EMITIDO',
    "comprobante_origen_id" TEXT,

    CONSTRAINT "comprobantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_comprobante" (
    "id" TEXT NOT NULL,
    "comprobante_id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "items_comprobante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comprobantes_tipo_punto_venta_letra_numero_key" ON "comprobantes"("tipo", "punto_venta", "letra", "numero");

-- AddForeignKey
ALTER TABLE "comprobantes" ADD CONSTRAINT "comprobantes_comprobante_origen_id_fkey" FOREIGN KEY ("comprobante_origen_id") REFERENCES "comprobantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_comprobante" ADD CONSTRAINT "items_comprobante_comprobante_id_fkey" FOREIGN KEY ("comprobante_id") REFERENCES "comprobantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
