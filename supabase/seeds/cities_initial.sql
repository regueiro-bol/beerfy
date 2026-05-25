insert into public.cities (slug, name, region, intro_html, latitude, longitude, is_published)
values
  (
    'ourense',
    'Ourense',
    'Galicia',
    'Ourense, capital termal de Galicia, esconde una densidad envidiable de bares donde la Estrella Galicia de Bodega se trata con el respeto que merece. Aquí te contamos dónde la tiran como toca.',
    42.3358,
    -7.8639,
    true
  ),
  (
    'vigo',
    'Vigo',
    'Galicia',
    'Vigo es puro Atlántico y su cultura de tabernas no se queda atrás. En esta ciudad industrial y marinera, la Estrella Galicia de Bodega acompaña los mejores pescados y tapas de la ría. Descubre dónde la sirven impecable.',
    42.2406,
    -8.7207,
    true
  ),
  (
    'madrid',
    'Madrid',
    'Comunidad de Madrid',
    'Madrid es la gran barra de España. Entre tabernas centenarias y locales de vanguardia, la Estrella Galicia de Bodega se ha hecho un hueco de honor. Aquí seleccionamos los templos madrileños que la tiran con arte.',
    40.4168,
    -3.7038,
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  region = excluded.region,
  intro_html = excluded.intro_html,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  is_published = excluded.is_published;
