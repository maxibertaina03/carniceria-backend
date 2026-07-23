-- AlterTable
ALTER TABLE "gastos" ADD COLUMN     "fecha_vencimiento" TIMESTAMP(3),
ADD COLUMN     "pagado" BOOLEAN NOT NULL DEFAULT true;

-- Las boletas que ya estaban a deber siguen pendientes de pago.
UPDATE "gastos" SET "pagado" = false WHERE "adeudado" = true;
