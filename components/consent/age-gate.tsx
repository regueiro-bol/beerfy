"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand/mark";

const COOKIE = "bfy-age";
const EXEMPT = ["/privacidad", "/aviso-legal", "/como-puntuamos"];

/**
 * Muro de edad. Se pinta siempre en el HTML y un script previo (layout raíz) añade la clase
 * `age-ok` a <html> si ya hay cookie, así no parpadea para quien ya respondió.
 * Los buscadores ven el contenido debajo (Google no penaliza los avisos de verificación de edad).
 */
export function AgeGate({ heroSrc }: { heroSrc: string }) {
  const [state, setState] = useState<"ask" | "no" | "done">("ask");
  const [remember, setRemember] = useState(true);
  const path = usePathname() || "/";

  function yes() {
    const maxAge = remember ? "; max-age=31536000" : "";
    document.cookie = `${COOKIE}=1; path=/; samesite=lax${maxAge}`;
    document.documentElement.classList.add("age-ok");
    setState("done");
  }

  // Los textos legales se pueden leer sin pasar el muro
  if (state === "done" || EXEMPT.includes(path)) return null;

  return (
    <div
      id="age-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[100] overflow-y-auto bg-ink text-cream"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[60%_40%] opacity-50"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,11,8,0.35)_0%,rgba(13,11,8,0.6)_40%,#0D0B08_78%)] md:bg-ink/70 md:backdrop-blur-sm" />

      <div className="relative mx-auto flex min-h-full max-w-[1320px] flex-col px-5 pb-8 pt-12 md:items-center md:justify-center md:px-8 md:py-12">
        <div className="flex flex-1 flex-col md:w-full md:max-w-[540px] md:flex-none md:gap-8 md:rounded-[32px] md:border md:border-cream/15 md:bg-ink/85 md:p-12 md:text-center md:shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]">
          <div className="flex items-center justify-center gap-2.5">
            <BrandMark size={40} />
            <span className="font-display text-[30px] font-extrabold tracking-[-0.03em]">
              beerfy
            </span>
          </div>

          <div className="mt-auto flex max-w-[460px] flex-col gap-5 md:mx-auto md:mt-0 md:w-full md:items-center">
            {state === "ask" ? (
              <>
                <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-amber">
                  Solo para mayores de edad
                </p>
                <h1
                  id="age-gate-title"
                  className="font-display text-[46px] font-extrabold leading-[0.95] tracking-[-0.035em] md:text-[64px]"
                >
                  Antes de la primera{" "}
                  <span className="font-serif font-normal italic text-amber">
                    caña
                  </span>
                  …
                </h1>
                <p className="text-[19px] font-semibold">
                  ¿Tienes 18 años o más?
                </p>
                <div className="flex flex-col gap-2.5 md:w-full">
                  <button
                    type="button"
                    onClick={yes}
                    className="h-[58px] rounded-[18px] bg-amber text-[17px] font-extrabold text-ink"
                  >
                    Sí, tengo 18 o más
                  </button>
                  <button
                    type="button"
                    onClick={() => setState("no")}
                    className="h-[54px] rounded-[18px] border-[1.5px] border-cream/45 text-[16px] font-semibold"
                  >
                    Todavía no
                  </button>
                </div>
                <label className="flex items-center gap-2.5 text-sm text-sand md:justify-center">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-5 w-5 accent-amber"
                  />
                  Recordarlo en este dispositivo
                </label>
                <p className="text-xs leading-relaxed text-[#A99F8B]">
                  Beerfy es una guía de bares para personas adultas. Bebe con
                  moderación. Guardamos tu respuesta en una cookie técnica; no
                  recogemos tu edad ni tu fecha de nacimiento.{" "}
                  <Link
                    href="/privacidad"
                    className="text-amber underline underline-offset-2"
                  >
                    Privacidad
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h1
                  id="age-gate-title"
                  className="font-display text-[40px] font-extrabold leading-[0.95] tracking-[-0.035em] md:text-[56px]"
                >
                  Te esperamos dentro de unos años.
                </h1>
                <p className="text-base leading-relaxed text-sand">
                  Beerfy habla de bares y de cerveza, así que es solo para
                  mayores de 18. Gracias por decir la verdad.
                </p>
                <button
                  type="button"
                  onClick={() => setState("ask")}
                  className="h-12 self-start rounded-full md:self-center border-[1.5px] border-cream/45 px-5 font-semibold"
                >
                  Me he equivocado
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
