/**
 * Lee una foto enviada por la web (multipart/form-data) o por la app (JSON con la foto en base64).
 * La app usa JSON porque el fetch de Expo en iOS/Android no admite archivos dentro de FormData.
 */
export type PhotoRequest = { photo: ArrayBuffer | null; type: string; fields: Record<string, string> }

export async function readPhotoRequest(req: Request): Promise<PhotoRequest | null> {
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return null
    const fields: Record<string, string> = {}
    for (const [k, v] of Object.entries(body)) if (k !== 'photo_base64' && (typeof v === 'string' || typeof v === 'number')) fields[k] = String(v)
    const b64 = typeof body.photo_base64 === 'string' ? body.photo_base64.replace(/^data:[^,]+,/, '') : ''
    const buf = b64 ? Buffer.from(b64, 'base64') : null
    return { photo: buf && buf.length ? buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length) : null, type: 'image/jpeg', fields }
  }
  const form = await req.formData().catch(() => null)
  if (!form) return null
  const fields: Record<string, string> = {}
  for (const [k, v] of form.entries()) if (typeof v === 'string') fields[k] = v
  const p = form.get('photo')
  return p instanceof Blob && p.size > 0 ? { photo: await p.arrayBuffer(), type: p.type, fields } : { photo: null, type: '', fields }
}
