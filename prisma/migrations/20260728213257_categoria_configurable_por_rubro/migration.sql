-- La categoría deja de ser un enum fijo (carnicero) y pasa a texto, para que
-- cada rubro defina sus propias categorías (config). Se conservan los valores
-- existentes con un cast explícito (no se borra la columna).
ALTER TABLE "productos" ALTER COLUMN "categoria" TYPE TEXT USING "categoria"::text;

-- El enum ya no se usa.
DROP TYPE "categoria_producto";
