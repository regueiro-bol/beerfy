/** Reduce la foto en el móvil (máx. 1600 px, JPEG) antes de subirla: va más rápido y gasta menos datos. */
export async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * k)
    c.height = Math.round(bmp.height * k)
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/jpeg', 0.82))
  } catch {
    return file
  }
}
