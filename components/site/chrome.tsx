import Link from "next/link";
import { BrandMark, BrandTile } from "@/components/brand/mark";
import { CookieSettingsLink } from "@/components/consent/cookie-banner";

const NAV = [
  { href: "/ciudades", label: "Ciudades" },
  { href: "/la-bodega", label: "La Bodega" },
  { href: "/sobre-beerfy", label: "Sobre Beerfy" },
];

export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  const ink = tone === "light" ? "#0D0B08" : "#F6F1E4";
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5"
      aria-label="Beerfy, inicio"
    >
      {tone === "light" ? <BrandTile size={36} /> : <BrandMark size={38} />}
      <span
        className="font-display text-[27px] font-extrabold tracking-[-0.03em]"
        style={{ color: ink }}
      >
        beerfy
      </span>
    </Link>
  );
}

/** Cabecera. `overlay` = transparente sobre foto oscura; `solid` = fondo papel. */
export function SiteHeader({
  variant = "solid",
  current,
}: {
  variant?: "overlay" | "solid";
  current?: string;
}) {
  const dark = variant === "overlay";
  return (
    <header
      className={
        dark
          ? "relative z-20 text-cream"
          : "relative z-20 border-b border-line bg-paper text-[#16140F]"
      }
    >
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 md:px-8 md:py-5">
        <Logo tone={dark ? "dark" : "light"} />
        <nav
          aria-label="Principal"
          className="hidden gap-8 text-[15px] font-medium md:flex"
        >
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={current === n.href ? "page" : undefined}
              className={`whitespace-nowrap py-2 hover:opacity-80 ${
                current === n.href
                  ? "font-bold underline decoration-2 underline-offset-[6px]"
                  : ""
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/sugerir"
          className="hidden rounded-full bg-amber px-5 py-3 text-sm font-bold text-ink transition hover:brightness-95 md:inline-block"
        >
          Sugerir un bar
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-ink text-[#A99F8B]">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-8 px-5 py-14 md:px-8">
        <span className="font-display text-[72px] leading-[0.8] font-extrabold tracking-[-0.05em] text-cream md:text-[120px]">
          beerfy
        </span>
        <div className="flex max-w-[520px] flex-col gap-3 text-[13px] leading-relaxed">
          <nav
            aria-label="Pie"
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-sand"
          >
            <Link href="/ciudades" className="hover:text-cream">
              Ciudades
            </Link>
            <Link href="/la-bodega" className="hover:text-cream">
              La Bodega
            </Link>
            <Link
              href="/estrella-galicia-de-bodega"
              className="hover:text-cream"
            >
              Estrella Galicia de Bodega
            </Link>
            <Link href="/sugerir" className="hover:text-cream">
              Sugerir un bar
            </Link>
            <Link href="/sobre-beerfy" className="hover:text-cream">
              Sobre Beerfy
            </Link>
            <Link href="/como-puntuamos" className="hover:text-cream">
              Cómo puntuamos
            </Link>
            <Link href="/aviso-legal" className="hover:text-cream">
              Aviso legal
            </Link>
            <Link href="/privacidad" className="hover:text-cream">
              Privacidad
            </Link>
            <CookieSettingsLink className="hover:text-cream" />
          </nav>
          <p>
            Beerfy es una guía independiente, sin afiliación con ninguna
            cervecera. Estrella Galicia es marca registrada de Hijos de Rivera
            S.A.U.; las marcas citadas pertenecen a sus propietarios y se
            mencionan solo para identificar la cerveza servida.
          </p>
          <p>
            Imágenes de ambiente generadas con IA. © {new Date().getFullYear()}{" "}
            Beerfy
          </p>
        </div>
      </div>
    </footer>
  );
}

const MARQUEE = [
  "Del tanque al vaso",
  "Sin pasteurizar",
  "Espuma de dos dedos",
  "Cadena de frío",
  "Puntúa la tirada",
];

export function Marquee() {
  const items = [...MARQUEE, ...MARQUEE];
  return (
    <div className="overflow-hidden bg-amber py-4" aria-hidden="true">
      <div className="bfy-marquee flex w-max gap-10 whitespace-nowrap font-display text-[26px] font-extrabold uppercase tracking-[-0.02em] text-ink md:text-[34px]">
        {items.map((t, i) => (
          <span key={i}>{t} ✦</span>
        ))}
      </div>
    </div>
  );
}

/** Borde de espuma: burbujas color `fill` sobre fondo `bg`. */
export function FoamEdge({
  fill = "#FBFAF7",
  bg = "#0D0B08",
  height = 90,
}: {
  fill?: string;
  bg?: string;
  height?: number;
}) {
  const bubbles = [
    [20, 74, 34],
    [90, 60, 44],
    [170, 78, 30],
    [240, 56, 48],
    [320, 76, 32],
    [390, 62, 40],
    [460, 80, 26],
    [530, 58, 46],
    [610, 74, 34],
    [690, 54, 50],
    [770, 78, 30],
    [840, 60, 42],
    [920, 76, 32],
    [990, 56, 46],
    [1070, 78, 28],
    [1140, 62, 42],
    [1220, 74, 34],
    [1290, 56, 46],
    [1370, 72, 36],
    [1430, 60, 40],
  ];
  return (
    <div style={{ background: bg, lineHeight: 0 }} aria-hidden="true">
      <svg
        viewBox="0 0 1440 120"
        width="100%"
        height={height}
        preserveAspectRatio="none"
        className="block"
      >
        <rect x="0" y="70" width="1440" height="50" fill={fill} />
        {bubbles.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={fill} />
        ))}
      </svg>
    </div>
  );
}

export function ScoreBadge({
  score,
  size = "md",
}: {
  score: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const cls =
    size === "lg"
      ? "text-[44px] px-3.5 py-2 rounded-[20px]"
      : size === "sm"
        ? "text-lg px-2 py-1 rounded-xl"
        : "text-[28px] px-3 py-1.5 rounded-2xl";
  if (score === null) {
    return (
      <span
        className={`inline-block bg-cream font-display font-extrabold leading-none text-ink ${cls}`}
        title="Aún sin puntuaciones"
      >
        –
      </span>
    );
  }
  return (
    <span
      className={`inline-block bg-amber font-display font-extrabold leading-none text-ink ${cls}`}
    >
      {formatScore(score)}
    </span>
  );
}

export function formatScore(n: number) {
  return n.toFixed(1).replace(".", ",");
}
