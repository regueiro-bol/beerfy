# Analítica de Beerfy (GTM GTM-TXZC7VZR → GA4)

La web empuja eventos al `dataLayer`. En Tag Manager:

1. **Variables → Variables de capa de datos** (una por parámetro): `method`, `content_type`, `item_id`, `location`, `label`, `answer`, `remember`, `reason`, `score`, `pending`, `state`, `distance`, `platform`, `page_path`.
2. **Activador** «Evento personalizado», nombre del evento (expresión regular):
   `^(age_gate_answer|share_open|share|rate_cta|rate_submit|rate_error|geo_permission|select_venue|nav_click|cta_click|click_maps|click_call|click_website|suggest_submit|pwa_install|pwa_installed|pwa_dismiss)$`
3. **Etiqueta** «Google Analytics: evento de GA4», ID de medición de GA4, nombre del evento `{{Event}}`, parámetros = las variables anteriores. Activador: el del paso 2.
4. En GA4 → Administrar → Definiciones personalizadas: crear dimensiones de evento para los parámetros que se quieran ver en informes (`method`, `location`, `item_id`, `label`, `reason`, `state`…).
5. Marcar como **eventos clave**: `rate_submit`, `share`, `suggest_submit`, `click_maps`.

| Evento | Cuándo | Parámetros |
|---|---|---|
| age_gate_answer | Responde al muro de edad | answer (yes/no), remember |
| share_open | Abre la hoja de compartir | location (icon/invite/tirada), content_type (ficha/tirada), item_id |
| share | Pulsa una red | method (whatsapp, instagram, tiktok, download, telegram, x, facebook, native, copy), content_type, item_id |
| rate_cta | Botón «Puntuar» | location (ficha/sticky/sticky_near), item_id |
| rate_submit | Nota enviada | item_id, score, pending |
| rate_error | Nota rechazada | reason (geo_denied, geo_unavailable o mensaje), item_id |
| geo_permission | Permiso de ubicación | state (granted/denied/error), location (home/cerca) |
| select_venue | Clic en un bar | label, location (card/cerca_home/cerca), distance |
| nav_click | Barra de pestañas móvil | label |
| cta_click | Botones de la home | label (cerca, que_es_bodega, sugerir), location |
| click_maps / click_call / click_website | Contacto del bar | item_id (web), page_path |
| suggest_submit | Sugerencia enviada | — |
| pwa_install / pwa_installed / pwa_dismiss | App en el móvil | platform |
| consent_update | Elección del banner de cookies | consent_analytics |

Los enlaces compartidos llevan `utm_source` (red), `utm_medium=share`, `utm_campaign` (ficha/tirada).

## Modo de apertura (app instalada vs navegador)

Antes de cargar GTM, la web empuja `{display_mode: 'app' | 'navegador'}` al dataLayer
(`app` = abierta desde el icono instalado, modo standalone). En GTM la variable
`DLV - display_mode` se envía como parámetro de configuración de la etiqueta de Google,
así que viaja con **todos** los eventos (page_view incluido). En GA4 es la dimensión
personalizada «Modo de apertura».
