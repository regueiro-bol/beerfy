import { NextResponse } from 'next/server'
import { hashClient } from '@/lib/ratings/submit'

/** Utilidades de la API pública que usa la app móvil de Beerfy. */

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Beerfy-Install',
}

export function json(data: unknown, init?: { status?: number; cache?: string }) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: { ...CORS, 'Cache-Control': init?.cache ?? 'no-store' },
  })
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

/** Huella anónima: el identificador de instalación de la app (o la IP si no llega). */
export function clientHashFrom(req: Request) {
  const install = (req.headers.get('x-beerfy-install') || '').trim()
  if (/^[A-Za-z0-9-]{16,64}$/.test(install)) return hashClient(`app:${install}`)
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  return hashClient(ip)
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json()
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  } catch {
    return null
  }
}
