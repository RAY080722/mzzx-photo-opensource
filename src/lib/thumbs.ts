const MAX_EDGE = 1280
const QUALITY = 0.82
const SKIP_BYTES = 250_000
const DECODE_TIMEOUT = 10_000

export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))])
}

function toJpegFile(canvas: HTMLCanvasElement): Promise<File | null> {
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ? new File([b], 'thumb.jpg', { type: 'image/jpeg' }) : null), 'image/jpeg', QUALITY),
  )
}

function drawScaled(src: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  canvas.getContext('2d')!.drawImage(src, 0, 0, canvas.width, canvas.height)
  return canvas
}

async function imageThumb(file: File): Promise<File | null> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image decode failed'))
    })
    const w = img.naturalWidth
    const h = img.naturalHeight
    if (!w || !h) return null
    if (w <= MAX_EDGE && h <= MAX_EDGE && file.size < SKIP_BYTES) return null
    return await toJpegFile(drawScaled(img, w, h))
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function videoThumb(file: File): Promise<File | null> {
  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = url
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve()
      video.onerror = () => reject(new Error('video decode failed'))
    })
    video.currentTime = Math.min(0.5, (video.duration || 1) / 2)
    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve()
      setTimeout(() => reject(new Error('seek timeout')), 5000)
    })
    if (!video.videoWidth) return null
    return await toJpegFile(drawScaled(video, video.videoWidth, video.videoHeight))
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

// 部分手机内置浏览器解码 Promise 可能不落地，超时即放弃缩略图，保证上传不卡死
export function makeImageThumb(file: File): Promise<File | null> {
  return withTimeout(imageThumb(file), DECODE_TIMEOUT)
}

export function makeVideoThumb(file: File): Promise<File | null> {
  return withTimeout(videoThumb(file), DECODE_TIMEOUT)
}