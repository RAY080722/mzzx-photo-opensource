import { useEffect, useState } from 'react'
import { cachedMediaUrl, resolveMediaUrl } from '@/lib/storage'

export function useMediaUrl(url?: string): string {
  const [src, setSrc] = useState(() => (url ? cachedMediaUrl(url) : ''))

  useEffect(() => {
    if (!url) {
      setSrc('')
      return
    }
    const cached = cachedMediaUrl(url)
    if (cached) {
      setSrc(cached)
      return
    }
    let alive = true
    resolveMediaUrl(url).then((u) => alive && setSrc(u))
    return () => {
      alive = false
    }
  }, [url])

  return src
}