# Beerfy

Guía colaborativa de bares con Estrella Galicia de Bodega.

## Stack
- Next.js 15 (App Router), TypeScript, Tailwind v4, shadcn/ui
- Supabase (Postgres, Auth, Vector)
- Anthropic (Claude) & Voyage AI
- Resend para emails

## Desarrollo Local

1. Clona el repositorio
2. Configura las variables de entorno (`cp .env.example .env.local`)
3. Instala dependencias con `npm install`
4. Arranca el entorno de desarrollo con `npm run dev`

## Verificación de estado

Para verificar que las conexiones están funcionando (Supabase, Anthropic, Voyage):
Abre `http://localhost:3000/api/health`. Debería devolver `ok: true` en los 3 checks.

Para detalles completos, revisa el archivo [PROJECT.md](./PROJECT.md).

## Iconos PWA
Se deben ubicar los iconos en la carpeta `public/icons/` (icon-192.png, icon-512.png, apple-touch-icon.png). Por el momento hay placeholders pendientes de generación gráfica real.
