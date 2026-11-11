# Beerfy — app de iOS y Android

App nativa (Expo / React Native) de [www.beerfy.es](https://www.beerfy.es): la guía de bares con cerveza de bodega.
Usa los mismos datos y reglas que la web a través de `https://www.beerfy.es/api/app/*` (en el repo `beerfy`).

- **Pantallas:** Inicio, Ciudades, Cerca de mí (mapa con el pin de Beerfy), La Bodega, Sugerir, ficha del bar, puntuar con GPS y avisos.
- **Identificador:** `es.beerfy.app` (iOS y Android).
- **Compilar y publicar:** con Expo (EAS). Perfiles en `eas.json`.

Pendiente antes de publicar en Android: clave de Google Maps para Android en `app.json` (`android.config.googleMaps.apiKey`).
