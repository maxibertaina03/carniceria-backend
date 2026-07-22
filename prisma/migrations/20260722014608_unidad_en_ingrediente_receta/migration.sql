-- Cada ingrediente de receta pasa a llevar la unidad en la que se carga su
-- cantidad (ej. 28 GRAMO de una sal que se compra y stockea por KG).
-- AlterTable
ALTER TABLE "ingredientes_receta" ADD COLUMN     "unidad" "unidad_medida" NOT NULL DEFAULT 'KG';

-- Las recetas que ya existían tenían la cantidad expresada en la unidad del
-- producto, así que se hereda esa unidad para no cambiarles el significado.
UPDATE "ingredientes_receta" AS i
SET "unidad" = p."unidad_medida"
FROM "productos" AS p
WHERE p."id" = i."producto_id";
