# Carnicería — Backend

API del sistema de gestión de la carnicería familiar: productos y stock, compras a proveedores, ventas (contado, fiado o mixto), cuentas corrientes de clientes y reportes.

**Stack:** NestJS 10 + Prisma 5 + PostgreSQL. Arquitectura DDD hexagonal: un módulo por contexto (`catalogo`, `compras`, `ventas`, `cuentas-corrientes`, `reportes`), cada uno con capas `dominio/`, `aplicacion/`, `infraestructura/` e `interfaces/`. Todo el código, la base de datos y la API están en español.

> Se eligió **Prisma** como ORM por la simplicidad de sus migraciones (`prisma migrate`) y su buen soporte con Supabase.

## Cómo correr el proyecto localmente

Requisitos: Node 18 o superior, Docker.

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de configuración (la URL local ya viene lista)
cp .env.example .env

# 3. Levantar la base de datos local (PostgreSQL en el puerto 5433)
docker compose up -d

# 4. Crear las tablas y cargar los productos iniciales
npx prisma migrate dev
npm run prisma:semilla

# 5. Arrancar la API
npm run start:dev
```

La API queda en `http://localhost:3000` y la **documentación Swagger en `http://localhost:3000/api`** (desde ahí se puede probar cada endpoint).

### Tests

```bash
npm test        # tests unitarios del dominio (invariantes de negocio)
npm run test:e2e  # flujo completo contra la base local (¡borra los datos de la base local!)
```

Si después de correr los tests e2e querés recuperar los productos iniciales: `npm run prisma:semilla`.

## Endpoints principales

| Módulo | Endpoints |
|---|---|
| Productos | `GET/POST /productos` · `GET/PATCH/DELETE /productos/:id` |
| Compras | `POST /compras` · `GET /compras` · `GET /compras/:id` |
| Ventas | `POST /ventas` · `GET /ventas` · `GET /ventas/:id` |
| Clientes | `GET/POST /clientes` · `GET/PATCH/DELETE /clientes/:id` · `GET /clientes/:id/movimientos` · `POST /clientes/:id/pagos` |
| Reportes | `GET /reportes/ganancias` · `GET /reportes/productos-mas-vendidos` · `GET /reportes/deudas` · `GET /reportes/stock` |

Reglas de negocio importantes:

- Una venta **se bloquea** si no hay stock suficiente.
- Una venta puede ser al contado, toda fiada o **mixta**: el campo `montoFiado` indica cuánto queda en la cuenta del cliente.
- Cada venta guarda el **costo del producto en ese momento**, así la ganancia histórica no cambia si el costo cambia después.
- Un pago de cliente no puede superar su deuda; un cliente con deuda no se puede desactivar.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string de PostgreSQL (local o Supabase) |
| `PORT` | Puerto de la API (opcional, 3000 por defecto; Render lo define solo) |

Nunca subir el archivo `.env` real al repositorio (ya está en `.gitignore`).

## Despliegue en producción (todo gratis)

El orden es: **1) Supabase (base de datos) → 2) Render (esta API) → 3) Vercel (el frontend)**.

### 1. Base de datos en Supabase

1. Crear cuenta en [supabase.com](https://supabase.com) e iniciar sesión.
2. **New project**: elegir nombre (ej. `carniceria`), una contraseña segura para la base (¡guardarla!) y la región más cercana (South America – São Paulo).
3. Cuando el proyecto termine de crearse, ir a **Project Settings → Database → Connection string** y copiar la URI en modo **Session pooler** (empieza con `postgresql://postgres...`). Reemplazar `[YOUR-PASSWORD]` por la contraseña elegida.
4. Crear las tablas en Supabase corriendo desde tu máquina:

   ```bash
   DATABASE_URL="<la URI de Supabase>" npx prisma migrate deploy
   DATABASE_URL="<la URI de Supabase>" npm run prisma:semilla
   ```

### 2. API en Render

1. Crear cuenta en [render.com](https://render.com) (se puede entrar con GitHub).
2. **New → Web Service** y conectar el repositorio `carniceria-backend`.
3. Completar:
   - **Language:** Node
   - **Build command:** `npm install && npx prisma generate && npm run build`
   - **Start command:** `npx prisma migrate deploy && npm run start:prod`
   - **Instance type:** Free
4. En **Environment Variables** agregar `DATABASE_URL` con la URI de Supabase.
5. **Deploy**. Al terminar, Render da una URL pública (ej. `https://carniceria-backend.onrender.com`). Probar abriendo `https://<tu-url>/api` (debe verse Swagger).

> Nota: al incluir `prisma migrate deploy` en el start command, cada deploy aplica las migraciones pendientes automáticamente.
> Nota 2: en el plan gratuito de Render el servicio "se duerme" tras unos minutos sin uso; la primera petición puede tardar ~1 minuto en responder.

### 3. Frontend en Vercel

Ver el README de `carniceria-frontend`: solo hay que configurar `VITE_API_URL` con la URL pública de Render.

## Seguridad (pendiente a futuro)

Por ahora **no hay login**: es un sistema de uso interno. Cuando haga falta, el lugar para agregar autenticación es un guard global en `src/main.ts` (hay un TODO marcado).
