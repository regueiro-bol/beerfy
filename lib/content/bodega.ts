/**
 * Contenido editorial de «La Bodega».
 * Regla: nada de cifras técnicas (temperaturas exactas, días de vida, capacidades)
 * sin una fuente citada. Si se añaden, enlazar la fuente en `sources`.
 */

export type Chapter = {
  slug: string;
  n: string;
  title: string;
  short: string;
  category:
    "Qué es" | "Fabricación" | "Logística" | "En el bar" | "Degustación";
  image: "tanks" | "truck" | "pour" | "hero" | "foam";
  minutes: number;
  lead: string;
  summary: string[];
  sections: Array<{ id: string; title: string; body: string[] }>;
  sources?: Array<{ label: string; url: string }>;
  /** Title SEO si difiere del H1. */
  metaTitle?: string;
  /** Meta description si difiere de la entradilla. */
  metaDescription?: string;
};

export const CHAPTERS: Chapter[] = [
  {
    slug: "que-es-la-cerveza-de-bodega",
    n: "01",
    title: "¿Qué es la cerveza de bodega?",
    short: "Cerveza sin pasteurizar que se sirve directa del tanque del bar.",
    category: "Qué es",
    image: "foam",
    minutes: 4,
    lead: "Es la misma cerveza de siempre con una diferencia clave: no se pasteuriza y no viaja en barril. Llega al bar en frío y se sirve desde tanques instalados en el propio local.",
    summary: [
      "No se pasteuriza: conserva más aroma y frescura.",
      "Llega al bar en cisterna refrigerada, no en barriles.",
      "Se guarda en tanques del local y se sirve desde ahí.",
      "Es más delicada: necesita frío constante y buena rotación.",
    ],
    sections: [
      {
        id: "definicion",
        title: "Cerveza viva, sin el último paso",
        body: [
          "La mayoría de la cerveza que se vende en barril o en botella se pasteuriza: se calienta brevemente para estabilizarla y alargar su vida. La cerveza de bodega se salta ese paso. El resultado es una cerveza más fresca y con más matices, pero también más delicada.",
          "Por eso no se envasa en barriles para viajar de bar en bar. Se transporta refrigerada a granel y se descarga en tanques fijos del local, desde donde va directamente al grifo.",
        ],
      },
      {
        id: "nombres",
        title: "Bodega, tanque, sin pasteurizar",
        body: [
          "En España, «cerveza de bodega» es como las cerveceras llaman a este servicio. Las dos grandes que lo ofrecen son Hijos de Rivera, con Estrella Galicia de Bodega y 1906 de Bodega, y Mahou San Miguel, que fue pionera con su sistema de tanque para San Miguel en 1997 y hoy lo sirve también con Mahou. En otros países se habla de cerveza de tanque: en la República Checa, por ejemplo, el «tankové pivo» es una tradición muy extendida.",
          "En Beerfy usamos «cerveza de bodega» y «cerveza de tanque» como sinónimos: cerveza sin pasteurizar servida desde tanque.",
        ],
      },
      {
        id: "por-que-importa",
        title: "Por qué importa dónde te la sirven",
        body: [
          "Una cerveza tan fresca deja menos margen de error. Si el bar no cuida el frío, la limpieza o la rotación del tanque, se nota en el vaso. Y si lo cuida, también. Por eso Beerfy no puntúa el bar en general: puntúa la tirada.",
        ],
      },
    ],
  },
  {
    slug: "como-se-fabrica",
    n: "02",
    title: "Cómo se fabrica: el proceso sin pasteurizar",
    short: "El mismo proceso cervecero, sin el paso final de pasteurización.",
    category: "Fabricación",
    image: "tanks",
    minutes: 5,
    lead: "Malta, agua, lúpulo y levadura. El proceso es el de cualquier lager; la diferencia está en lo que no se hace al final.",
    summary: [
      "Maceración y cocción: se extraen los azúcares de la malta y se aromatiza con lúpulo.",
      "Fermentación y guarda en frío: la levadura trabaja y la cerveza se afina.",
      "Sin pasteurizar: se conserva el perfil fresco a cambio de una vida más corta.",
    ],
    sections: [
      {
        id: "mosto",
        title: "Del grano al mosto",
        body: [
          "La malta se muele y se mezcla con agua caliente para convertir sus almidones en azúcares. Ese líquido dulce, el mosto, se filtra y se cuece con lúpulo, que aporta amargor y aroma.",
        ],
      },
      {
        id: "fermentacion",
        title: "Fermentación y guarda",
        body: [
          "Ya frío, el mosto pasa a los tanques de fermentación, donde la levadura transforma los azúcares en alcohol y gas carbónico. En las lager sigue un periodo de guarda en frío que redondea el sabor.",
        ],
      },
      {
        id: "sin-pasteurizar",
        title: "El paso que no se da",
        body: [
          "La pasteurización calienta la cerveza para eliminar microorganismos y hacerla estable durante meses. Funciona, pero puede apagar parte de los aromas más frescos. La cerveza de bodega no pasa por ahí: sale de la fábrica tal cual, y a partir de ese momento el frío y el tiempo mandan.",
        ],
      },
    ],
  },
  {
    slug: "transporte-cadena-de-frio",
    n: "03",
    title: "Transporte: la cadena de frío hasta el bar",
    short:
      "Cisternas refrigeradas de la fábrica al tanque, sin romper el frío.",
    category: "Logística",
    image: "truck",
    minutes: 4,
    lead: "Una cerveza sin pasteurizar no puede esperar en un almacén ni calentarse en un muelle de carga. El viaje es parte del producto.",
    summary: [
      "Viaja a granel en cisternas refrigeradas.",
      "La cadena de frío no debe romperse en ningún momento.",
      "Se descarga directamente en los tanques del bar.",
    ],
    sections: [
      {
        id: "cisterna",
        title: "A granel y en frío",
        body: [
          "En lugar de barriles, la cerveza de bodega viaja en cisternas refrigeradas. Al llegar al bar se trasvasa por manguera a los tanques del local, sin pasar por envases intermedios.",
        ],
      },
      {
        id: "frio",
        title: "Por qué el frío es innegociable",
        body: [
          "Sin pasteurización, la temperatura es lo que mantiene la cerveza estable. Un corte de frío durante el transporte o la descarga acelera su envejecimiento, y eso acaba notándose en el sabor y en la espuma.",
        ],
      },
    ],
  },
  {
    slug: "el-tanque-en-el-bar",
    n: "04",
    title: "En el bar: tanque, limpieza y rotación",
    short: "Donde se gana o se pierde la cerveza.",
    category: "En el bar",
    image: "pour",
    minutes: 5,
    lead: "El tanque del bar es la última parada antes del grifo. Tener uno exige espacio, volumen de venta y mucha disciplina.",
    summary: [
      "Tanques refrigerados instalados en el propio local.",
      "La rotación importa: cuanto antes se sirve, mejor está.",
      "Las líneas y grifos necesitan limpieza periódica.",
    ],
    sections: [
      {
        id: "tanque",
        title: "Un tanque no es un barril grande",
        body: [
          "Los tanques se instalan de forma fija, normalmente en una zona refrigerada del local, y se rellenan desde la cisterna. Muchos sistemas de tanque usan bolsas interiores de un solo uso para que la cerveza no toque las paredes ni el aire.",
        ],
      },
      {
        id: "rotacion",
        title: "Rotación: la clave de la frescura",
        body: [
          "Una cerveza sin pasteurizar está en su mejor momento al principio. Los bares que venden mucha cerveza de bodega la renuevan a menudo, y eso se nota. Por eso no todos los locales pueden tenerla: necesitan volumen suficiente.",
        ],
      },
      {
        id: "limpieza",
        title: "Limpieza del circuito",
        body: [
          "Entre el tanque y el vaso hay tuberías, serpentines y grifos. Si no se limpian con regularidad, aparecen sabores extraños y la espuma se vuelve inestable. Es el trabajo invisible que distingue una buena tirada.",
        ],
      },
    ],
  },
  {
    slug: "del-tanque-al-vaso",
    n: "05",
    title: "Del tanque al vaso: cómo se tira una buena caña de bodega",
    metaTitle: "Cómo tirar una caña perfecta, paso a paso",
    metaDescription:
      "Cómo tirar una caña de cerveza paso a paso: copa mojada, primer chorro fuera, inclinada a 45 grados, 2 cm de crema y a 4–5 ºC. Lo que hace una buena tirada de cerveza de bodega.",
    short:
      "Copa mojada, 45 grados, dos centímetros de crema y bien fría. Lo que tienes que mirar.",
    category: "Degustación",
    image: "hero",
    minutes: 6,
    lead: "Una cerveza sin pasteurizar llega al grifo en su mejor momento. A partir de ahí, todo depende de quien la sirve.",
    summary: [
      "Copa limpia y mojada con agua fría justo antes de servir.",
      "Se descarta el primer chorro y se llena con la copa inclinada a unos 45 grados, pegada al grifo.",
      "Se corona con unos 2 cm de crema densa que haga de tapa.",
      "Bien fría, pero no helada: las cerveceras recomiendan en torno a 4–5 ºC.",
    ],
    sections: [
      {
        id: "vaso",
        title: "1. La copa",
        body: [
          "Una copa con restos de grasa o detergente mata la espuma antes de que nazca. La señal es fácil de ver: burbujas pegadas a las paredes y una corona que se deshace en segundos.",
          "Justo antes de servir, la copa se moja por dentro con agua fría; en muchos bares hay un grifo «mojacopas» para eso. Así se enfría, se arrastran las impurezas y la cerveza resbala mejor por el cristal. Secarla con un trapo deja pelusa y grasa: mejor dejarla escurrir.",
        ],
      },
      {
        id: "tirada",
        title: "2. La tirada",
        body: [
          "Se abre el grifo y se deja ir el primer chorro, que suele salir con más gas o más templado. Después se acerca la copa a la salida del grifo, inclinada unos 45 grados, para que la cerveza se deslice por la pared en lugar de caer desde arriba.",
          "Se llena de forma continua, sin movimientos bruscos ni dejar caer la cerveza desde lejos. Cuando faltan unos dos centímetros para el borde, se cierra el grifo y se retira la copa.",
        ],
      },
      {
        id: "espuma",
        title: "3. La crema",
        body: [
          "El último paso es la corona: con la copa ya derecha se completa con unos 2 cm de espuma densa y blanca. No es un adorno: hace de tapa para que la cerveza no se oxide y retiene el aroma.",
          "Debajo de la crema queda una capa de gas, la «nube», que ayuda a conservar el sabor. Y si la espuma es buena, al beber va dejando en el cristal un aro por cada trago.",
        ],
      },
      {
        id: "temperatura",
        title: "4. La temperatura",
        body: [
          "Demasiado fría anestesia el paladar y esconde los matices; demasiado templada se vuelve plana. Para la cerveza de bodega, las cerveceras suelen recomendar servirla entre 4 y 5 ºC: bien fría, pero no helada.",
        ],
      },
      {
        id: "cata",
        title: "5. Cómo disfrutarla",
        body: [
          "Mira el color y la espuma, acércate a la copa y bebe a tragos generosos, pasando la cerveza a través de la crema. Cuenta los aros que deja. No la dejes calentar en la mano: una caña se bebe en su momento.",
        ],
      },
    ],
    sources: [
      {
        label: "Mahou — El arte de tirar una cerveza",
        url: "https://www.mahou.es/el-arte-de-tirar-una-cerveza/",
      },
      {
        label: "Estrella Galicia — Cerveza de Bodega (ficha de producto)",
        url: "https://estrellagalicia.es/producto/estrella-galicia-cerveza-de-bodega/",
      },
    ],
  },
  {
    slug: "cerveza-de-bodega-vs-barril",
    n: "06",
    title: "¿Cerveza de bodega o de barril? En qué se diferencian",
    metaTitle: "Diferencia entre cerveza de bodega y cerveza de barril",
    metaDescription:
      "Cerveza de bodega vs cerveza de barril: la de barril se pasteuriza antes de envasarse; la de bodega no, viaja en cisterna refrigerada y se sirve desde tanque. Qué cambia en el bar y en el vaso.",
    short:
      "Pasteurización, envase y camino hasta el bar: lo que cambia entre una y otra.",
    category: "Qué es",
    image: "tanks",
    minutes: 5,
    lead: "Las dos salen de un grifo y pueden partir de la misma receta. Lo que cambia es lo que pasa entre la fábrica y el vaso: si se pasteuriza, en qué viaja y cómo se guarda en el bar.",
    summary: [
      "La de barril suele pasteurizarse justo antes de envasarse, para aguantar semanas fuera de fábrica.",
      "La de bodega no se pasteuriza: viaja en cisterna refrigerada y se descarga en tanques fijos del bar.",
      "Por eso la de bodega depende mucho más del frío, la limpieza y la rotación del local.",
      "En el vaso manda la tirada: una de bodega mal servida pierde frente a una de barril bien cuidada.",
    ],
    sections: [
      {
        id: "pasteurizacion",
        title: "La gran diferencia: la pasteurización",
        body: [
          "La mayoría de la cerveza que se vende en barril, botella o lata pasa por una pasteurización antes de envasarse. En las cerveceras grandes lo habitual es la pasteurización «flash»: la cerveza se calienta durante unos segundos y se enfría de inmediato. Así se inactivan los microorganismos que podrían alterarla y la cerveza aguanta mucho más tiempo fuera del frío.",
          "La cerveza de bodega se salta ese paso. Es la misma cerveza recién hecha, sin el tratamiento térmico del final. A cambio, no puede salir de la cadena de frío en ningún momento, desde la fábrica hasta el grifo.",
        ],
      },
      {
        id: "envase",
        title: "Barril frente a tanque",
        body: [
          "El barril es un envase de acero que sale lleno de la fábrica, se almacena en el bar y se conecta al grifo. Cuando se vacía, se cambia por otro.",
          "La cerveza de bodega no usa barriles. Llega en una cisterna refrigerada y se trasvasa a tanques fijos instalados en el local, desde donde va directa al grifo. En el caso de Estrella Galicia, la marca explica que la cerveza viaja y se conserva dentro de una bolsa estéril de un solo uso, tanto en la cisterna como en el tanque del bar.",
        ],
      },
      {
        id: "en-el-bar",
        title: "Qué implica para el bar",
        body: [
          "Un barril es cómodo: se guarda en la cámara, se pincha cuando hace falta y aguanta. Por eso casi cualquier bar puede servir cerveza de barril.",
          "Tener cerveza de bodega exige más: espacio para los tanques, frío constante y, sobre todo, vender lo suficiente para que la cerveza rote y esté siempre fresca. Por eso no está en todos los bares, y por eso los que la tienen suelen presumir de ella.",
        ],
      },
      {
        id: "en-el-vaso",
        title: "¿Se nota en el vaso?",
        body: [
          "Quien las compara suele hablar de una cerveza de bodega más fresca y con más aroma. Pero la ventaja de partida se puede perder por el camino: un tanque con poca rotación, unas líneas mal limpias o una copa con grasa estropean cualquier cerveza.",
          "Por eso en Beerfy no puntuamos la marca ni el bar en general, sino la tirada: temperatura, espuma, vaso y frescura. Es lo que de verdad separa una buena caña de una normal.",
        ],
      },
      {
        id: "como-reconocerla",
        title: "Cómo saber si te la sirven de bodega",
        body: [
          "La pista más clara son los tanques: suelen estar a la vista, en la barra o en una sala del local, con la imagen de la cerveza de bodega. Algunos bares tienen ya tanques verticales, que ocupan menos y se ven desde la barra.",
          "Si no los ves, pregunta: en un bar que la tiene, te lo dirán con gusto. Y si quieres ir sobre seguro, en Beerfy solo publicamos bares revisados que la sirven.",
        ],
      },
    ],
    sources: [
      {
        label: "Estrella Galicia — Cerveza de Bodega (ficha de producto)",
        url: "https://estrellagalicia.es/producto/estrella-galicia-cerveza-de-bodega/",
      },
      {
        label:
          "Birrapedia — Estrella Galicia Cerveza de Bodega (descripción de la marca: cisterna y bolsa estéril)",
        url: "https://birrapedia.com/comparador/pilsner-urquell---estrella-galicia-cerveza-de-bodega/527f4e59d187e401090041ff-55c1fd16f70fb56e20a13f71",
      },
      {
        label: "Goodnature — Beer pasteurization: flash y túnel",
        url: "https://cbp.goodnature.com/beer-pasteurization-history-methods-equipment",
      },
      {
        label:
          "Hijos de Rivera — Primer bar con tanques verticales de Cerveza de Bodega",
        url: "https://corporacionhijosderivera.com/en/first-pub-with-estrella-galicia-vertical-tanks-in-spain",
      },
    ],
  },
  {
    slug: "marcas-cerveza-de-bodega",
    n: "07",
    title:
      "Marcas de cerveza de bodega en España: Estrella Galicia, Mahou y San Miguel",
    metaTitle:
      "Marcas de cerveza de bodega: Estrella Galicia, Mahou y San Miguel",
    metaDescription:
      "Qué cerveceras sirven cerveza de bodega (sin pasteurizar, de tanque) en España: Estrella Galicia y 1906 de Hijos de Rivera, y Mahou y San Miguel de Mahou San Miguel. Cómo lo hace cada una.",
    short:
      "Quién sirve cerveza de tanque en España y en qué se parecen sus sistemas.",
    category: "Qué es",
    image: "truck",
    minutes: 4,
    lead: "La cerveza de bodega no es una marca: es una forma de servir la cerveza. En España la ofrecen sobre todo dos grandes cerveceras, cada una con sus marcas y su propio sistema de tanques.",
    summary: [
      "Hijos de Rivera: Estrella Galicia de Bodega y 1906 de Bodega, desde su fábrica de A Coruña.",
      "Mahou San Miguel: pionera en España con el tanque de San Miguel en 1997; hoy también con Mahou.",
      "Todas comparten lo esencial: sin pasteurizar, cadena de frío y tanques fijos en el bar.",
      "La marca te dice qué cerveza es; la tirada, si te la sirven bien.",
    ],
    sections: [
      {
        id: "hijos-de-rivera",
        title: "Estrella Galicia y 1906 (Hijos de Rivera)",
        body: [
          "Estrella Galicia de Bodega es la versión sin pasteurizar de Estrella Galicia: una Helles Exportbier de 5,5 % que sale de la fábrica de A Coruña y viaja en frío hasta el bar, donde se descarga en tanques. Hijos de Rivera extendió después el mismo servicio a su marca 1906.",
          "La compañía ha ido renovando los tanques: en A Coruña inauguró el primer bar con tanques verticales de Cerveza de Bodega, pensados para ocupar menos y verse desde la barra.",
        ],
      },
      {
        id: "mahou-san-miguel",
        title: "Mahou y San Miguel (Mahou San Miguel)",
        body: [
          "Mahou San Miguel fue pionera en España con el sistema de tanque: lo lanzó con San Miguel en 1997 y, según la propia compañía, sentó las bases del modelo actual de cerveza sin pasteurizar del sector. Hoy lo ofrece también con Mahou y lo llama, igual que el resto, cerveza de bodega.",
          "En 2026 anunció un nuevo tanque de 500 litros, apilable y con cámara refrigerada interna, conectado a Púlsar, un sistema propio que vigila en tiempo real el volumen, el consumo, la temperatura y la presión. Prevé llevarlo a 700 locales en cinco años.",
        ],
      },
      {
        id: "en-comun",
        title: "Lo que tienen en común",
        body: [
          "Cambian la marca y el diseño del tanque, pero la idea es la misma: cerveza sin pasteurizar, que no sale de la cadena de frío y que se sirve desde tanques fijos del local, sin barriles.",
          "Eso también significa que comparten los mismos riesgos: si el bar no cuida el frío, la limpieza de las líneas o la rotación, la ventaja se pierde. Por eso en Beerfy puntuamos la tirada y no la marca.",
        ],
      },
      {
        id: "como-reconocerla",
        title: "Cómo saber cuál te están sirviendo",
        body: [
          "Mira los tanques y la cartelería: los bares que sirven cerveza de bodega suelen tener los tanques a la vista, con la imagen de la marca, y lo anuncian en la barra o en la fachada. Si tienes dudas, pregunta qué cerveza de tanque tienen.",
          "En Beerfy empezamos por los bares con Estrella Galicia de Bodega y vamos a ir sumando los de otras marcas. Si conoces un bar con tanque de Mahou o San Miguel, puedes sugerirlo.",
        ],
      },
    ],
    sources: [
      {
        label: "Estrella Galicia — Cerveza de Bodega (ficha de producto)",
        url: "https://estrellagalicia.es/producto/estrella-galicia-cerveza-de-bodega/",
      },
      {
        label:
          "Alimarket — Hijos de Rivera extiende el modelo de cerveza de bodega a 1906",
        url: "https://www.alimarket.es/alimentacion/noticia/305492/hijos-de-rivera-extiende-el-modelo-de-cerveza-de-bodega-a--1906-",
      },
      {
        label:
          "Hijos de Rivera — Primer bar con tanques verticales de Cerveza de Bodega",
        url: "https://corporacionhijosderivera.com/en/first-pub-with-estrella-galicia-vertical-tanks-in-spain",
      },
      {
        label:
          "Alimarket — Mahou San Miguel apuesta por la digitalización de la cerveza de bodega",
        url: "https://www.alimarket.es/alimentacion/noticia/428823/mahou-san-miguel-apuesta-por-la-digitalizacion-de-la-cerveza-de-bodega",
      },
      {
        label:
          "Vinetur — Mahou San Miguel llevará control digital en tiempo real a 700 locales de hostelería (7 jul 2026)",
        url: "https://www.vinetur.com/es/20260707103829/mahou-san-miguel-llevara-control-digital-en-tiempo-real-a-700-locales-de-hosteleria.html",
      },
    ],
  },
];

export const FAQ = [
  {
    q: "¿Qué marcas sirven cerveza de bodega?",
    a: "En España, sobre todo Hijos de Rivera (Estrella Galicia de Bodega y 1906 de Bodega) y Mahou San Miguel, que fue pionera con el tanque de San Miguel en 1997 y hoy también lo ofrece con Mahou.",
  },
  {
    q: "¿En qué se diferencia la cerveza de bodega de la de barril?",
    a: "La de barril normalmente está pasteurizada y llega en barriles que se conectan al grifo. La de bodega no se pasteuriza, viaja refrigerada en cisterna y se guarda en tanques fijos del bar.",
  },
  {
    q: "¿Por qué no se encuentra en todos los bares?",
    a: "Porque exige instalar tanques refrigerados, tener espacio y vender suficiente volumen para que la cerveza rote y esté siempre fresca.",
  },
  {
    q: "¿Es lo mismo cerveza de bodega que cerveza de tanque?",
    a: "En Beerfy usamos ambos nombres para lo mismo: cerveza sin pasteurizar servida directamente desde tanque. «De bodega» es la expresión más habitual en España.",
  },
  {
    q: "¿Qué puntúa Beerfy exactamente?",
    a: "La tirada, no el bar: temperatura, espuma, vaso y frescura. La media de la comunidad da la Nota de tirada de 0 a 10.",
  },
];

export function getChapter(slug: string) {
  return CHAPTERS.find((c) => c.slug === slug) ?? null;
}
