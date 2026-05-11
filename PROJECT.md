# Beerfy — Project Constitution

> Guía colaborativa de bares con Estrella Galicia de Bodega. Web first, mobile-first, con vocación de evolucionar a app. **La IA es ciudadana de primera clase del producto**, no un añadido decorativo.
>
> Este documento es el contexto maestro del proyecto. Antigravity y cualquier agente o desarrollador debe leerlo antes de hacer cambios.

---

## 1. ¿Qué es Beerfy?

Beerfy es una guía colaborativa de **bares y cervecerías que sirven Estrella Galicia de Bodega correctamente**. Funciona como directorio curado con capa social: los usuarios descubren locales por ciudad, valoran cómo se sirve la cerveza en cada uno, y la comunidad sugiere bares nuevos para que el equipo editorial los revise y los publique.

La diferencia con Google Maps o cualquier guía generalista es el **enfoque vertical absoluto y el uso intensivo de IA editorial**: solo bares con EG de bodega, solo el ángulo "te la sirven bien o no", y un sistema editorial asistido por IA que escala curación de calidad a decenas o cientos de bares sin perder voz propia.

**Usuario tipo**: aficionado a la cerveza, conoce la diferencia entre EG de barril normal y EG de bodega, busca activamente sitios donde tirarla bien, viaja entre ciudades y quiere recomendaciones locales sin depender de reseñas genéricas. Edad 25-55, mobile-first, llega por SEO orgánico.

**Lo que Beerfy NO es**: no es app oficial de Hijos de Rivera, no está afiliado con Estrella Galicia, no es local físico, no es generalista. Referencia el producto "Estrella Galicia de Bodega" como término descriptivo, sin usar logos, colores corporativos ni elementos visuales de la marca.

## 2. Filosofía del proyecto

- **Hobby personal con vocación de utilidad real.** Sin presión comercial, sin monetización en V1.
- **Mobile-first sin negociación.** Mayoría del tráfico llegará desde móvil.
- **PWA-ready desde V1.** Manifest, service worker básico, instalable. Cuando llegue app nativa, tendremos base.
- **Calidad sobre cantidad.** Mejor 20 locales bien curados que 200 medio publicados.
- **SEO local como pilar.** Cada decisión técnica se evalúa contra el objetivo de rankear "Estrella Galicia de Bodega en [ciudad]" por encima de la competencia.
- **Comunidad ligera, sin login obligatorio en V1.**
- **IA con criterio.** Cada uso de IA está justificado: o ahorra tiempo de curación a escala humanamente inviable, o aporta valor real al usuario final. Nunca IA por moda.

## 3. Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind v4 |
| UI components | shadcn/ui |
| Mapas | Google Maps JavaScript API + Google Places API |
| Hosting | Vercel, región Frankfurt (fra1) |
| Backend / DB | Supabase (Postgres + Auth opcional + Storage + pgvector), región EU |
| LLM principal | Anthropic API (Claude Sonnet) — generación editorial, moderación, síntesis |
| Embeddings | Voyage AI — para similitud semántica de bares (detección duplicados, clusters) |
| Email transaccional | Resend |
| Almacenamiento | Supabase Storage o Vercel Blob |
| Repo | GitHub |
| Dominios | beerfy.bar (principal) · beerfy.es (redirect 301) · beerfy.app (reservado) |

**Variables de entorno requeridas**:

```
ANTHROPIC_API_KEY=
VOYAGE_API_KEY=
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=hola@beerfy.bar
ADMIN_EMAIL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://beerfy.bar
```

## 4. Reglas innegociables (HARD RULES)

### 4.1 Marca y posicionamiento

- **Nunca usar el logo de Estrella Galicia, su tipografía corporativa, ni sus colores oficiales.** Beerfy tiene identidad propia.
- **Sí se puede mencionar "Estrella Galicia de Bodega" como término descriptivo** en titulares, descripciones y SEO. Uso referencial legítimo.
- **Disclaimer visible en footer**: "Beerfy es una guía independiente sin afiliación oficial con Hijos de Rivera S.A.U. Estrella Galicia es marca registrada de su propietario."
- En contenidos generados o redactados, usar "EG de Bodega", "la de bodega", "cerveza de bodega" como sinónimos para variar registro.

### 4.2 Seguridad y privacidad

- **RLS activa en TODAS las tablas con datos de usuario, sin excepción.** Catálogos públicos con lectura abierta y escritura solo desde service_role.
- **SUPABASE_SERVICE_ROLE_KEY nunca llega al cliente.**
- **Hosting en EU**: Supabase Frankfurt/Irlanda, Vercel `fra1`.
- **Sugerencias y valoraciones sin cuenta**, pero con captcha (hCaptcha o Cloudflare Turnstile) y rate limiting por IP.
- **Email del usuario guardado como hash** salvo opt-in explícito ("avisame cuando publiquéis el bar").

### 4.3 SEO no negociable

- Schema.org `LocalBusiness` / `BarOrPub` en cada ficha.
- Sitemap.xml dinámico generado desde Supabase, regenerado al publicar.
- URLs limpias: `/madrid`, `/madrid/la-tasca-del-puerto`.
- Slugs estables: una vez generado, no cambia.
- Open Graph + Twitter Card en todas las páginas.

### 4.4 Moderación de contenido

- **Todo lo aportado por la comunidad pasa por moderación antes de publicarse.** Estados: `pending`, `approved`, `rejected`.
- Panel /admin protegido (basic auth o magic link a ADMIN_EMAIL).
- Valoraciones (estrellas) se publican inmediatamente pero pueden ocultarse desde moderación.

### 4.5 Mobile-first y PWA

- Diseño desde 375px de ancho hacia arriba.
- Touch targets ≥ 44x44px.
- `next/image` para todas las imágenes, lazy loading.
- Manifest y service worker básico desde V1.

### 4.6 Uso responsable de IA (CRÍTICO)

- **Toda generación de contenido por IA pasa por revisión humana antes de publicarse.** La IA es asistente editorial, no autor publicado directamente.
- **Nunca generar bares ficticios.** Si no hay datos reales, no se publica nada.
- **Nunca generar imágenes IA de bares reales.** Foto real o placeholder honesto.
- **Las síntesis de reseñas se publican como "lo que opina la gente sobre este sitio", no como hechos verificados.**
- **Prompts versionados** en `lib/prompts/`, archivados con fecha y propósito. Cualquier cambio incrementa versión.
- **Logs de uso de IA sin contenido sensible**, solo metadatos (timestamp, modelo, tokens, función llamada).
- **Coste monitorizado**: dashboard interno mensual de gasto en APIs de IA. Si supera un umbral configurable, alerta por email.

## 5. Arquitectura de URLs

```
/                                  → Landing + hub editorial
/que-es-estrella-galicia-bodega    → Página pilar
/ciudades                          → Listado ciudades
/{ciudad}                          → Ciudad
/{ciudad}/{slug-del-local}         → Ficha de local
/{ciudad}/rutas                    → Rutas editoriales de la ciudad (Sprint 6+)
/{ciudad}/rutas/{slug-ruta}        → Ruta concreta
/sugerir                           → Formulario público
/sobre-beerfy                      → Quiénes somos
/legal/privacidad
/legal/aviso-legal
/legal/cookies
/admin                             → Panel moderación
/admin/sugerencias                 → Cola moderación
/admin/venues                      → Listado venues
/admin/venues/[id]                 → Editor venue (con asistencia IA)
/admin/dashboard-ia                → Uso y coste IA mensual
```

## 6. Estructura de carpetas

```
beerfy/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── que-es-estrella-galicia-bodega/page.tsx
│   │   ├── ciudades/page.tsx
│   │   ├── [ciudad]/
│   │   │   ├── page.tsx
│   │   │   ├── [venue]/page.tsx
│   │   │   └── rutas/
│   │   │       ├── page.tsx
│   │   │       └── [ruta]/page.tsx
│   │   ├── sugerir/page.tsx
│   │   ├── sobre-beerfy/page.tsx
│   │   └── legal/
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── sugerencias/page.tsx
│   │   ├── venues/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── dashboard-ia/page.tsx
│   ├── api/
│   │   ├── ai/
│   │   │   ├── generate-description/route.ts
│   │   │   ├── synthesize-reviews/route.ts
│   │   │   ├── moderate-suggestion/route.ts
│   │   │   ├── detect-pour-quality/route.ts
│   │   │   ├── cluster-venues/route.ts
│   │   │   └── personalize/route.ts
│   │   ├── sugerencias/route.ts
│   │   ├── valoraciones/route.ts
│   │   ├── revalidate/route.ts
│   │   └── places/lookup/route.ts
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── manifest.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   └── feature/
│       ├── venue-card/
│       ├── city-map/
│       ├── rating-widget/
│       ├── suggest-form/
│       ├── personalized-section/
│       └── admin/
│           ├── ai-description-helper/
│           ├── ai-review-synthesizer/
│           └── ai-cost-dashboard/
├── lib/
│   ├── supabase/
│   ├── anthropic/
│   │   ├── client.ts
│   │   ├── description-generator.ts
│   │   ├── review-synthesizer.ts
│   │   ├── suggestion-moderator.ts
│   │   ├── pour-quality-detector.ts
│   │   ├── venue-clusterer.ts
│   │   └── personalizer.ts
│   ├── voyage/
│   │   ├── embeddings.ts
│   │   └── duplicate-detector.ts
│   ├── google/
│   │   ├── maps.ts
│   │   └── places.ts
│   ├── resend/notify.ts
│   ├── seo/schema.ts
│   ├── prompts/
│   │   ├── description-generator.v1.ts
│   │   ├── review-synthesizer.v1.ts
│   │   ├── suggestion-moderator.v1.ts
│   │   ├── pour-quality.v1.ts
│   │   ├── venue-clusterer.v1.ts
│   │   └── personalizer.v1.ts
│   ├── ai-logging/index.ts
│   └── types/
├── supabase/
│   ├── migrations/
│   └── seeds/
├── public/
├── .env.example
├── .env.local
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── README.md
└── PROJECT.md
```

## 7. Modelo de datos

```sql
-- Ciudades
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  region text,
  intro_html text,
  latitude numeric,
  longitude numeric,
  is_published boolean default false,
  venue_count int default 0,
  created_at timestamptz default now()
);

-- Bares/cervecerías
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities on delete cascade not null,
  slug text not null,
  name text not null,
  google_place_id text unique,
  address text,
  district text,
  latitude numeric,
  longitude numeric,
  phone text,
  website text,
  hours_json jsonb,
  description text,                          -- generada con IA + revisión humana
  description_ai_version text,               -- versión del prompt que generó borrador
  description_edited_by_human boolean default false,
  highlights text[],                         -- ['Terraza', 'Cervecero', ...]
  serves_eg_bodega boolean default true,
  served_with_bodega_glass boolean,
  served_temperature_ok boolean,
  pour_quality_ai_score numeric,             -- 0-1, derivado de reseñas (feature 5)
  pour_quality_ai_notes text,
  cluster_tags text[],                       -- ['clásicos', 'tranquilos'], asignados por IA
  cover_image_url text,
  embedding vector(1024),                    -- voyage embedding del venue (similitud + duplicados)
  status text check (status in ('draft','published','archived')) default 'draft',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (city_id, slug)
);

-- Síntesis de reseñas externas (Google) generada por IA
create table public.venue_review_synthesis (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues on delete cascade not null,
  generated_at timestamptz default now(),
  source text default 'google_places',
  source_review_count int,
  strengths text[],
  weaknesses text[],
  overall_tone text,
  pour_specific_mentions text,
  ai_prompt_version text not null,
  is_visible boolean default true
);

-- Valoraciones de la comunidad
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues on delete cascade not null,
  rating smallint check (rating between 1 and 5) not null,
  pour_quality text check (pour_quality in ('good','average','bad')),
  comment text,
  visitor_email_hash text,
  user_agent text,
  ip_hash text,
  status text check (status in ('visible','hidden')) default 'visible',
  created_at timestamptz default now()
);

-- Sugerencias de la comunidad
create table public.venue_suggestions (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities,
  city_name_freetext text,
  venue_name text not null,
  address text,
  google_place_id text,
  notes text,
  submitter_email text,
  notify_when_published boolean default false,
  ai_quality_score numeric,                  -- 0-1 generado por moderador IA
  ai_classification text,                    -- 'high_quality','duplicate','spam','out_of_scope'
  ai_duplicate_of uuid references public.venues,
  ai_notes text,
  ai_processed_at timestamptz,
  ai_prompt_version text,
  status text check (status in ('pending','approved','rejected','duplicate')) default 'pending',
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz default now()
);

-- Log de uso de IA (auditoría + control de coste)
create table public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  function_name text not null,               -- 'description_generator','review_synthesizer',...
  prompt_version text not null,
  model text not null,
  input_tokens int,
  output_tokens int,
  estimated_cost_usd numeric(8,4),
  duration_ms int,
  status text check (status in ('success','error','rate_limited')),
  target_type text,                          -- 'venue','suggestion'
  target_id uuid,
  error_detail text,
  created_at timestamptz default now()
);

-- Rutas editoriales (Sprint 6+)
create table public.routes (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities not null,
  slug text not null,
  title text not null,
  intro text,
  venue_ids uuid[] not null,
  ai_generated boolean default true,
  ai_prompt_version text,
  human_edited boolean default false,
  status text check (status in ('draft','published')) default 'draft',
  created_at timestamptz default now(),
  unique (city_id, slug)
);

-- Log básico de admin
create table public.admin_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target_type text,
  target_id uuid,
  notes text,
  created_at timestamptz default now()
);
```

## 8. Uso de IA en Beerfy (las 6 features de V1)

Cada feature de IA tiene su archivo de prompt versionado en `lib/prompts/{nombre}.v1.ts`, su función helper en `lib/anthropic/{nombre}.ts`, y su endpoint API en `app/api/ai/{nombre}/route.ts`. Todas pasan por el wrapper de `ai-logging` que persiste métricas en `ai_usage_log`.

### Feature 1 — Generador asistido de descripciones (Sprint 2)

**Propósito**: convertir datos crudos de un venue en descripción editorial publicable, con voz consistente y SEO.

**Input**: nombre, dirección, datos de Google Places (categorías, horarios, fotos), nota del editor, ciudad.

**Output JSON estructurado**:
```typescript
{
  description: string,           // 80-120 palabras
  meta_title: string,            // <60 chars
  meta_description: string,      // <155 chars
  highlights: string[],          // 3-5 tags
  suggested_district: string,
  tone: 'classic' | 'modern' | 'sports' | 'family' | 'cervecero' | 'fiestero'
}
```

**Regla**: el editor puede aceptar, editar o regenerar. Hasta que pulse "publicar", `description_edited_by_human` queda en `false`. Cualquier edición humana lo pone a `true`. Esto se trackea para análisis de calidad del generador.

### Feature 2 — Sintetizador de reseñas de Google (Sprint 4)

**Propósito**: procesar las últimas N reseñas del venue en Places API y devolver un resumen objetivo.

**Input**: lista de hasta 50 reseñas recientes.

**Output JSON**:
```typescript
{
  strengths: string[],           // 3 más mencionados
  weaknesses: string[],          // 2 si los hay
  overall_tone: string,
  pour_specific_mentions: string // qué dice la gente sobre cómo sirven la cerveza
}
```

**Regla**: la síntesis se persiste en `venue_review_synthesis`. Se muestra al usuario público como sección "Esto opina la gente sobre este sitio" con disclaimer ("Resumen generado a partir de reseñas públicas de Google"). El editor puede ocultarla si la considera mal hecha (`is_visible=false`).

### Feature 3 — Moderador automático de sugerencias (Sprint 3)

**Propósito**: pre-clasificar sugerencias entrantes para acelerar moderación humana.

**Input**: sugerencia entrante + búsqueda de duplicados en BD (por similitud de embedding + matching fuzzy de nombre/dirección).

**Output JSON**:
```typescript
{
  quality_score: number,         // 0-1
  classification: 'high_quality' | 'duplicate' | 'spam' | 'out_of_scope' | 'needs_review',
  duplicate_of_venue_id: string | null,
  reasoning: string              // breve, para el editor
}
```

**Regla**: la sugerencia llega al panel admin pre-ordenada por `quality_score`. Si `classification='duplicate'`, se marca y enlaza con el venue existente. El editor siempre tiene la última palabra; la IA solo orienta.

### Feature 4 — Cluster temático de venues (Sprint 6)

**Propósito**: agrupar venues de una ciudad en clusters narrativos para crear contenido editorial automático ("Los 5 más tranquilos", "Para una tarde de tapeo", etc.).

**Input**: lista de venues de una ciudad con sus highlights, tone, pour_quality_ai_score y embedding.

**Output JSON**:
```typescript
{
  clusters: Array<{
    theme: string,               // 'clásicos de toda la vida'
    description: string,         // micro-narrativa
    venue_ids: string[],
    slug_suggestion: string      // para crear ruta editorial
  }>
}
```

**Regla**: el output se usa como **borrador** para que el editor cree rutas editoriales (tabla `routes`). No se publica nunca sin revisión humana. Es la entrada al sistema de rutas/itinerarios.

### Feature 5 — Detector de calidad de tirada en reseñas (Sprint 4)

**Propósito**: ya con las reseñas sintetizadas, detectar específicamente qué dice la gente sobre cómo se sirve la cerveza, y derivar un score de "calidad de tirada según reseñas".

**Input**: reseñas brutas del venue (mismo input que feature 2, pero distinto prompt).

**Output JSON**:
```typescript
{
  pour_quality_score: number,    // 0-1
  positive_mentions: string[],   // ej: ['siempre fresca','espuma justa','vaso correcto']
  negative_mentions: string[],
  confidence: number             // 0-1 según cantidad y claridad de menciones
}
```

**Regla**: se persiste en `venues.pour_quality_ai_score` y `pour_quality_ai_notes`. Se combina con valoraciones de la comunidad para mostrar al usuario público una nota global "Calidad de la tirada en este sitio: X/5", con explicación de cómo se calcula.

### Feature 6 — Personalización ligera (Sprint 6)

**Propósito**: en la página de ciudad, mostrar una sección "Para ti hoy" con 3 venues recomendados según señales simples.

**Input**: hora del día, día de la semana, geolocalización opcional, ciudad actual, venues disponibles.

**Output**: 3 venue_ids + 1 frase justificativa generada por IA ("Como es jueves y vas en plan tapas, te recomendamos estos 3...").

**Regla**: la selección de venues es **lógica clásica determinista** (filtros por highlights, distancia, hora). La IA solo redacta la justificación. Esto controla coste y evita variabilidad indeseable en las recomendaciones.

## 9. Convenciones de código

- TypeScript strict (`"strict": true`, `"noUncheckedIndexedAccess": true`).
- Server Components por defecto. Client Components solo con interactividad.
- Server Actions para mutaciones internas, API routes para endpoints públicos e integraciones.
- Tailwind only. No CSS custom salvo reset.
- Naming: kebab-case archivos, PascalCase componentes, camelCase funciones, UPPER_SNAKE constantes.
- Commits convencionales: `feat:`, `fix:`, `chore:`, `seo:`, `content:`, `ai:` (cambios en prompts o lógica IA).
- Cada cambio en un prompt: commit con prefijo `ai:` y bump de versión del archivo (`v1` → `v2`).

## 10. Plan de sprints (con IA integrada)

### Sprint 0 — Setup (medio día)
Repo + Next.js 15 + TS + Tailwind + shadcn + Supabase client (3 variantes) + Anthropic + Voyage + Resend + endpoint `/api/health` + manifest PWA + deploy en Vercel.

### Sprint 1 — Datos y página de ciudad (1-2 días)
Schema completo con RLS. Seed con Ourense, Vigo, Madrid. Página de ciudades, página de ciudad funcional.

### Sprint 2 — Ficha de local + Google Maps + IA Feature 1 (2-3 días)
Página de ficha de local con datos, mapa, Schema.org. Integración Places API. **Generador asistido de descripciones (Feature 1)** funcionando en panel admin (aunque admin aún sea básico). Carga manual de 5-10 venues en Ourense usando el generador.

### Sprint 3 — Capa colaborativa + IA Feature 3 (2 días)
Formulario sugerencias con captcha. Widget valoración rápida. Notificación a admin por email. **Moderador automático de sugerencias (Feature 3)** con detección de duplicados vía embeddings de Voyage.

### Sprint 4 — Panel admin + IA Features 2 y 5 (2-3 días)
Panel /admin protegido. Cola sugerencias con clasificación IA. Editor de venue con descripción asistida (ya integrada en Sprint 2). **Sintetizador de reseñas Google (Feature 2)** + **Detector de calidad de tirada (Feature 5)** funcionando, sus outputs visibles en ficha pública.

### Sprint 5 — SEO, PWA, pulido + dashboard IA (1-2 días)
Sitemap dinámico, Schema.org pulido, Open Graph, manifest PWA completo, service worker básico, hub editorial principal. **Dashboard interno de uso y coste de IA** en `/admin/dashboard-ia`.

### Sprint 6 — IA Features 4 y 6 + rutas editoriales (2-3 días)
**Cluster temático (Feature 4)** generando borradores de rutas en panel admin. Editor crea/publica rutas. **Personalización "Para ti hoy" (Feature 6)** en página de ciudad.

### Sprint 7+ (futuro, según ganas)
Chat conversacional, generador de rutas conversacional, detector mensual de cambios, ampliación a más ciudades.

## 11. Definition of done por feature

1. ✅ Funciona end-to-end en local.
2. ✅ RLS verificada cuando aplica.
3. ✅ Mobile responsive a 375px.
4. ✅ Loading + empty + error states.
5. ✅ Tipos TS correctos.
6. ✅ Schema.org cuando aplique.
7. ✅ **Si lleva IA**: prompt versionado en `lib/prompts/`, función helper en `lib/anthropic/`, logging en `ai_usage_log`, revisión humana antes de publicar contenido.
8. ✅ Deploy en Vercel verificado.

## 12. Lo que NO se hace en V1

- ❌ Login social ni cuentas obligatorias.
- ❌ Sistema de reputación, badges, gamificación.
- ❌ Monetización, ads.
- ❌ App nativa.
- ❌ Notificaciones push.
- ❌ Multi-idioma.
- ❌ Reservas o intermediación.
- ❌ Imágenes IA de bares reales.
- ❌ Generación automática de venues ficticios.
- ❌ Chat conversacional al usuario (es Sprint 7+).
