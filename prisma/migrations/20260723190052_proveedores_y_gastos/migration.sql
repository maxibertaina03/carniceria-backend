-- AlterTable
ALTER TABLE "compras" ADD COLUMN     "monto_adeudado" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "proveedor_id" TEXT;

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "saldo_adeudado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_proveedor" (
    "id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "tipo" "tipo_movimiento" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "compra_id" TEXT,
    "gasto_id" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "movimientos_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concepto" TEXT NOT NULL,
    "categoria" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "adeudado" BOOLEAN NOT NULL DEFAULT false,
    "proveedor_id" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_proveedor" ADD CONSTRAINT "movimientos_proveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_proveedor" ADD CONSTRAINT "movimientos_proveedor_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_proveedor" ADD CONSTRAINT "movimientos_proveedor_gasto_id_fkey" FOREIGN KEY ("gasto_id") REFERENCES "gastos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
