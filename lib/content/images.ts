import hero from "@/public/images/hero.jpg";
import foam from "@/public/images/foam.jpg";
import tanks from "@/public/images/tanks.jpg";
import pour from "@/public/images/pour.jpg";
import truck from "@/public/images/truck.jpg";
import bar1 from "@/public/images/bar1.jpg";
import bar2 from "@/public/images/bar2.jpg";
import bar3 from "@/public/images/bar3.jpg";
// Fotos reales de Regueiro (Beerfy), con caras difuminadas.
import tankEg from "@/public/images/tank-eg.jpg";
import tanksCopper from "@/public/images/tanks-copper.jpg";
import glass1906 from "@/public/images/glass-1906.jpg";
import glass1906b from "@/public/images/glass-1906-b.jpg";
import glass1906top from "@/public/images/glass-1906-top.jpg";

/** Imágenes de ambiente (IA, genéricas) + fotos reales propias (tankEg, tanksCopper, glass1906*). */
export const IMG = {
  hero,
  foam,
  tanks,
  pour,
  truck,
  bar1,
  bar2,
  bar3,
  tankEg,
  tanksCopper,
  glass1906,
  glass1906b,
  glass1906top,
};
export const BAR_AMBIENCE = [bar1, bar2, bar3] as const;
