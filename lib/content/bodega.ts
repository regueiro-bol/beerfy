/**
 * Contenido editorial de «La Bodega».
 * Regla: nada de cifras técnicas (temperaturas exactas, días de vida, capacidades)
 * sin una fuente citada. Si se añaden, enlazar la fuente en `sources`.
 */

export type Chapter = {
  slug: string
  n: string
  title: string
  short: string
  category: 'Qué es' | 'Fabricación' | 'Logística' | 'En el bar' | 'Degustación'
  image: 'tanks' | 'truck' | 'pour' | 'hero' | 'foam'
  minutes: number
  lead: string
  summary: string[]
  sections: Array<{ id: string; title: string; body: string[] }>
}

export const CHAPTERS: Chapter[] = [
  {
    slug: 'que-es-la-cerveza-de-bodega',
    n: '01',
    title: '¿Qué es la cerveza de bodega?',
    short: 'Cerveza sin pasteurizar que se sirve directa del tanque del bar.',
    category: 'Qué es',
    image: 'foam',
    minutes: 4,
    lead: 'Es la misma cerveza de siempre con una diferencia clave: no se pasteuriza y no viaja en barril. Llega al bar en frío y se sirve desde tanques instalados en el propio local.',
    summary: [
      'No se pasteuriza: conserva más aroma y frescura.',
      'Llega al bar en cisterna refrigerada, no en barriles.',
      'Se guarda en tanques del local y se sirve desde ahí.',
      'Es más delicada: necesita frío constante y buena rotación.',
    ],
    sections: [
      {
        id: 'definicion',
        title: 'Cerveza viva, sin el último paso',
        body: [
          'La mayoría de la cerveza que se vende en barril o en botella se pasteuriza: se calienta brevemente para estabilizarla y alargar su vida. La cerveza de bodega se salta ese paso. El resultado es una cerveza más fresca y con más matices, pero también más delicada.',
          'Por eso no se envasa en barriles para viajar de bar en bar. Se transporta refrigerada a granel y se descarga en tanques fijos del local, desde donde va directamente al grifo.',
        ],
      },
      {
        id: 'nombres',
        title: 'Bodega, tanque, sin pasteurizar',
        body: [
          'En España la expresión «cerveza de bodega» se asocia sobre todo a Estrella Galicia de Bodega, la referencia más conocida de este formato. En otros países la idea es la misma y se habla de cerveza de tanque: en la República Checa, por ejemplo, el «tankové pivo» es una tradición muy extendida.',
          'En Beerfy usamos «cerveza de bodega» y «cerveza de tanque» como sinónimos: cerveza sin pasteurizar servida desde tanque.',
        ],
      },
      {
        id: 'por-que-importa',
        title: 'Por qué importa dónde te la sirven',
        body: [
          'Una cerveza tan fresca deja menos margen de error. Si el bar no cuida el frío, la limpieza o la rotación del tanque, se nota en el vaso. Y si lo cuida, también. Por eso Beerfy no puntúa el bar en general: puntúa la tirada.',
        ],
      },
    ],
  },
  {
    slug: 'como-se-fabrica',
    n: '02',
    title: 'Cómo se fabrica: el proceso sin pasteurizar',
    short: 'El mismo proceso cervecero, sin el paso final de pasteurización.',
    category: 'Fabricación',
    image: 'tanks',
    minutes: 5,
    lead: 'Malta, agua, lúpulo y levadura. El proceso es el de cualquier lager; la diferencia está en lo que no se hace al final.',
    summary: [
      'Maceración y cocción: se extraen los azúcares de la malta y se aromatiza con lúpulo.',
      'Fermentación y guarda en frío: la levadura trabaja y la cerveza se afina.',
      'Sin pasteurizar: se conserva el perfil fresco a cambio de una vida más corta.',
    ],
    sections: [
      {
        id: 'mosto',
        title: 'Del grano al mosto',
        body: [
          'La malta se muele y se mezcla con agua caliente para convertir sus almidones en azúcares. Ese líquido dulce, el mosto, se filtra y se cuece con lúpulo, que aporta amargor y aroma.',
        ],
      },
      {
        id: 'fermentacion',
        title: 'Fermentación y guarda',
        body: [
          'Ya frío, el mosto pasa a los tanques de fermentación, donde la levadura transforma los azúcares en alcohol y gas carbónico. En las lager sigue un periodo de guarda en frío que redondea el sabor.',
        ],
      },
      {
        id: 'sin-pasteurizar',
        title: 'El paso que no se da',
        body: [
          'La pasteurización calienta la cerveza para eliminar microorganismos y hacerla estable durante meses. Funciona, pero puede apagar parte de los aromas más frescos. La cerveza de bodega no pasa por ahí: sale de la fábrica tal cual, y a partir de ese momento el frío y el tiempo mandan.',
        ],
      },
    ],
  },
  {
    slug: 'transporte-cadena-de-frio',
    n: '03',
    title: 'Transporte: la cadena de frío hasta el bar',
    short: 'Cisternas refrigeradas de la fábrica al tanque, sin romper el frío.',
    category: 'Logística',
    image: 'truck',
    minutes: 4,
    lead: 'Una cerveza sin pasteurizar no puede esperar en un almacén ni calentarse en un muelle de carga. El viaje es parte del producto.',
    summary: [
      'Viaja a granel en cisternas refrigeradas.',
      'La cadena de frío no debe romperse en ningún momento.',
      'Se descarga directamente en los tanques del bar.',
    ],
    sections: [
      {
        id: 'cisterna',
        title: 'A granel y en frío',
        body: [
          'En lugar de barriles, la cerveza de bodega viaja en cisternas refrigeradas. Al llegar al bar se trasvasa por manguera a los tanques del local, sin pasar por envases intermedios.',
        ],
      },
      {
        id: 'frio',
        title: 'Por qué el frío es innegociable',
        body: [
          'Sin pasteurización, la temperatura es lo que mantiene la cerveza estable. Un corte de frío durante el transporte o la descarga acelera su envejecimiento, y eso acaba notándose en el sabor y en la espuma.',
        ],
      },
    ],
  },
  {
    slug: 'el-tanque-en-el-bar',
    n: '04',
    title: 'En el bar: tanque, limpieza y rotación',
    short: 'Donde se gana o se pierde la cerveza.',
    category: 'En el bar',
    image: 'pour',
    minutes: 5,
    lead: 'El tanque del bar es la última parada antes del grifo. Tener uno exige espacio, volumen de venta y mucha disciplina.',
    summary: [
      'Tanques refrigerados instalados en el propio local.',
      'La rotación importa: cuanto antes se sirve, mejor está.',
      'Las líneas y grifos necesitan limpieza periódica.',
    ],
    sections: [
      {
        id: 'tanque',
        title: 'Un tanque no es un barril grande',
        body: [
          'Los tanques se instalan de forma fija, normalmente en una zona refrigerada del local, y se rellenan desde la cisterna. Muchos sistemas de tanque usan bolsas interiores de un solo uso para que la cerveza no toque las paredes ni el aire.',
        ],
      },
      {
        id: 'rotacion',
        title: 'Rotación: la clave de la frescura',
        body: [
          'Una cerveza sin pasteurizar está en su mejor momento al principio. Los bares que venden mucha cerveza de bodega la renuevan a menudo, y eso se nota. Por eso no todos los locales pueden tenerla: necesitan volumen suficiente.',
        ],
      },
      {
        id: 'limpieza',
        title: 'Limpieza del circuito',
        body: [
          'Entre el tanque y el vaso hay tuberías, serpentines y grifos. Si no se limpian con regularidad, aparecen sabores extraños y la espuma se vuelve inestable. Es el trabajo invisible que distingue una buena tirada.',
        ],
      },
    ],
  },
  {
    slug: 'del-tanque-al-vaso',
    n: '05',
    title: 'Del tanque al vaso: cómo se tira una buena caña de bodega',
    short: 'Vaso, ángulo, espuma y temperatura. Lo que tienes que mirar.',
    category: 'Degustación',
    image: 'hero',
    minutes: 6,
    lead: 'Una cerveza sin pasteurizar llega al grifo en su mejor momento. A partir de ahí, todo depende de quien la sirve.',
    summary: [
      'Vaso limpio y enjuagado en agua fría justo antes de servir.',
      'Tirada con el vaso inclinado, enderezando al final para formar la corona.',
      'Unos dos dedos de espuma densa que aguante sin desplomarse.',
      'Bien fría, pero no helada: que se note el sabor.',
    ],
    sections: [
      {
        id: 'vaso',
        title: '1. El vaso',
        body: [
          'Un vaso con restos de grasa o detergente mata la espuma antes de que nazca. La señal es fácil de ver: burbujas pegadas a las paredes y una corona que se deshace en segundos.',
          'Lo ideal es un vaso limpio, frío y enjuagado con agua justo antes de servir. Secarlo con un trapo deja pelusa y grasa: mejor dejarlo escurrir.',
        ],
      },
      {
        id: 'tirada',
        title: '2. La tirada',
        body: [
          'El vaso se coloca inclinado bajo el grifo, sin que este toque la cerveza, y se abre el grifo de una vez. A medida que se llena, se va enderezando para que al final se forme la corona de espuma.',
          'Abrir el grifo a medias o tirar la primera espuma «para limpiar» son malas costumbres: desperdician cerveza y empeoran la textura.',
        ],
      },
      {
        id: 'espuma',
        title: '3. La espuma',
        body: [
          'La espuma no es un adorno: protege la cerveza del aire y concentra los aromas. Una buena corona es densa, blanca y cremosa, de unos dos dedos, y al beber va dejando anillos de encaje en el vaso.',
        ],
      },
      {
        id: 'temperatura',
        title: '4. La temperatura',
        body: [
          'Demasiado fría anestesia el paladar y esconde los matices; demasiado templada se vuelve plana. La cerveza de bodega se disfruta bien fría, pero no helada.',
        ],
      },
      {
        id: 'cata',
        title: '5. Cómo disfrutarla',
        body: [
          'Mira el color y la espuma, acércate al vaso y bebe a tragos generosos, pasando la cerveza a través de la espuma. No la dejes calentar en la mano: una caña se bebe en su momento.',
        ],
      },
    ],
  },
]

export const FAQ = [
  {
    q: '¿En qué se diferencia la cerveza de bodega de la de barril?',
    a: 'La de barril normalmente está pasteurizada y llega en barriles que se conectan al grifo. La de bodega no se pasteuriza, viaja refrigerada en cisterna y se guarda en tanques fijos del bar.',
  },
  {
    q: '¿Por qué no se encuentra en todos los bares?',
    a: 'Porque exige instalar tanques refrigerados, tener espacio y vender suficiente volumen para que la cerveza rote y esté siempre fresca.',
  },
  {
    q: '¿Es lo mismo cerveza de bodega que cerveza de tanque?',
    a: 'En Beerfy usamos ambos nombres para lo mismo: cerveza sin pasteurizar servida directamente desde tanque. «De bodega» es la expresión más habitual en España.',
  },
  {
    q: '¿Qué puntúa Beerfy exactamente?',
    a: 'La tirada, no el bar: temperatura, espuma, vaso y frescura. La media de la comunidad da la Nota de tirada de 0 a 10.',
  },
]

export function getChapter(slug: string) {
  return CHAPTERS.find((c) => c.slug === slug) ?? null
}
