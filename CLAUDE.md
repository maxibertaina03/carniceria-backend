# CLAUDE.md — Sistema de gestión (carnicería + fábrica de pastas)

Contexto para asistentes de IA (Claude Code / Cursor). **Leé esto entero antes de tocar nada.**

## Qué es
Sistema de gestión para negocios familiares — una **carnicería** y una **fábrica de pastas**, ambas **en producción y en uso real**. Es **un solo código configurable por rubro**; cada negocio corre como una **instancia separada** (deploy + base de datos propios). Objetivo a futuro: comercializarlo a más negocios.

## Layout (dos repos, carpetas hermanas)
- `carniceria-backend/` — NestJS 10 + Prisma 5 + PostgreSQL. DDD hexagonal.
- `carniceria-frontend/` — React 18 + Vite 5 + Tailwind 3 + React Query 5 + axios.

## Reglas de oro (NO romper)
1. **TODO en español**: clases, propiedades, variables, endpoints, tablas (snake_case), mensajes y comentarios. Es deliberado — el dueño no es técnico.
2. **DDD + bounded contexts + hexagonal**: cada contexto tiene capas `dominio/ aplicacion/ infraestructura/ interfaces`. El dominio NO conoce Prisma ni NestJS. Puertos (clases abstractas) en dominio/aplicacion; adaptadores en infraestructura. Entre contextos se habla por puertos, nunca importando servicios de otro contexto.
3. **Nada de hardcodeo de lo que depende del rubro** — sale de la config (ver Multi-rubro).
4. **Lo específico de un rubro va detrás de un feature-flag**; con el flag off, el otro rubro NO cambia en nada. La carnicería está en producción: cuidarla.
5. **Value objects**: `Dinero` (no negativo, 2 decimales), `Cantidad`; helpers `redondearMoneda`/`redondearCantidad`. Agregados con props privadas, `crear`/`reconstruir` estáticos, getters, invariantes en el dominio.
6. **Transacciones**: `UnidadDeTrabajo` (envuelve Prisma `$transaction`) + `clienteDeContexto(prisma, ctx)` en los repos.
7. **Tests + migración antes de desplegar.** Migraciones **aditivas** o con cast que **preserva datos** (nunca destructivas sobre datos reales).
8. **Un push despliega las DOS instancias** (miran el mismo repo). Verificar/probar en **pastas**, nunca alterar datos reales de la carnicería sin pedirlo.

## Bounded contexts (backend `src/`)
`configuracion`, `catalogo`, `compras`, `ventas`, `cuentas-corrientes`, `proveedores`, `gastos`, `desposte`, `produccion`, `pedidos`, `reportes`, `facturacion`. `comun` = kernel compartido (Dinero, Cantidad, UnidadDeTrabajo, redondeo, seguridad).

## Multi-rubro (el corazón del diseño)
- Variable de entorno **`RUBRO`** (`carniceria` | `pastas`; default `carniceria`).
- Contexto `configuracion`: **`GET /config`** devuelve `nombreNegocio`, `modulos` (qué secciones se ven), `categorias`, `features` (`lotes`, `presentaciones`), `etiquetas` (textos por rubro) e `iconos` (emojis del menú por rubro). Todo definido en `src/configuracion/dominio/rubros.ts`. Puerto `LectorConfiguracion` para que otros contextos lo lean.
- Frontend: `ConfiguracionProvider` + `useConfiguracion()`. El menú, categorías, nombre, iconos y textos de ejemplo salen de la config, no están fijos.
- **Categorías**: NO son un enum; son texto validado contra la config del rubro (en `ServicioProductos`).
- **Features**: `lotes` (stock por lote con vencimiento, consumo FIFO — `GestorLotes`, se auto-desactiva si el flag está off) y `presentaciones` (½ kg, docena; puerto `ResolvedorPresentaciones` que resuelve una presentación a producto+cantidad+precio en la venta). `desposte` visible solo en carnicería.

## Seguridad
- Clave compartida: la app manda `x-clave-api` == env `CLAVE_API` (guardia global `GuardiaClaveApi`). Ruta pública `/salud`.
- CORS limitado a env `ORIGEN_PERMITIDO`.
- Área admin (facturación): contraseña propia, `x-admin-clave` == env `ADMIN_CLAVE` (`GuardiaAdmin` en el controller de facturación). **No hay login de usuarios** (a futuro: Clerk).

## Deploy (instancia por cliente, mismo repo)
- **Carnicería**: Render `carniceria-backend` (sin `RUBRO` → carniceria) + su base Supabase; Vercel `carniceria-frontend`.
- **Pastas**: Render `pastas-backend` (`RUBRO=pastas`) + OTRA base Supabase; Vercel `pastas-frontend`.
- Env por instancia (los **valores viven en Render/Vercel, no en el repo**): backend `RUBRO`, `DATABASE_URL`, `CLAVE_API`, `ADMIN_CLAVE`, `ORIGEN_PERMITIDO`; frontend `VITE_API_URL`, `VITE_CLAVE_API`.
- Render corre `prisma migrate deploy` al arrancar. Frontend: `vercel deploy --prod --archive=tgz`. Hace falta `vercel.json` con rewrite SPA (ya está, si no, refrescar rutas da 404).

## Cómo correr / probar (local)
Backend (`carniceria-backend/`):
- Postgres local en Docker, puerto **5433** (el 5432 lo usa otro proyecto). `docker start carniceria-postgres`.
- `.env` con `DATABASE_URL` local. `npm run start:dev`. `npx prisma migrate dev`. `npm test` (jest) y `npm run test:e2e`. `npm run build`.
- **Node local es v18.19.1** → por eso NestJS 10 / Vite 5 / Tailwind 3. No subir majors sin verificar Node.
- Migración enum→String: Prisma no castea solo → `prisma migrate dev --create-only` y editar el SQL con `ALTER ... TYPE TEXT USING col::text`.

Frontend (`carniceria-frontend/`): `npm run dev`, `npm run build`. Gráficos con Recharts (barras con `isAnimationActive={false}`).

## Funciones ya construidas
Productos (stock, foto/imagen base64, ajuste de stock, **actualización masiva de precios por %**), lotes con vencimiento, presentaciones, ventas (contado/fiado/mixto, por presentación), compras (con proveedor, adeudado), proveedores (cuentas por pagar, deuda inicial, pagos), gastos (boletas con vencimiento, marcar pagada), clientes (fiado, cuenta corriente), pedidos (encargue → entrega = venta), desposte (media res → cortes con costo repartido), producción (recetas, producir por unidad o por presentación), reportes (con gráficos), facturación (comprobantes internos, admin), pantalla de inicio (resumen del día + avisos de vencimientos).

## Roadmap / pendientes (charlados con el dueño)
Backups automáticos de la base (**crítico**), medios de pago (efectivo/tarjeta/transferencia/QR) + cierre de caja, stock mínimo + reposición, WhatsApp (estado de cuenta/recordatorios/pedidos), pantalla de configuración del negocio (onboarding sin tocar código), multi-empresa (SaaS), AFIP real, login con Clerk.

## Cómo trabajar acá (resumen para el asistente)
Antes de codear: entendé el contexto que tocás y buscá el patrón que ya existe (puertos, adaptadores, VOs). Respetá español + DDD + capas. Lo del rubro va por config/flags. Sumá tests y migración. No rompas la carnicería. Verificá en pastas.
