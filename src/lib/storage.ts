import COS from 'cos-js-sdk-v5'
import { tcbApp, ensureAuth } from './tcb'
import { IS_DEMO, COS_BUCKET, COS_REGION, ADMIN_API_URL } from './config'
import { putBlob, deleteBlob, resolveIdbUrl, cachedUrl } from './mock/mediaStore'

export interface UploadResult {
  url: string
  key: string
  type: 'image' | 'video'
}

let cosClient: COS | null = null

async function fetchCosSts() {
  const res = await fetch(ADMIN_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cosSts' }),
  })
  const r = await res.json()
  if (r.error) throw new Error(r.error)
  return r
}

function getCos(): COS {
  if (!cosClient) {
    cosClient = new COS({
      getAuthorization: async (_options, callback) => {
        const r = await fetchCosSts()
        callback({
          TmpSecretId: r.credentials.tmpSecretId,
          TmpSecretKey: r.credentials.tmpSecretKey,
          SecurityToken: r.credentials.sessionToken,
          StartTime: r.startTime,
          ExpiredTime: r.expiredTime,
        })
      },
    })
  }
  return cosClient
}

export async function uploadFile(file: File, onProgress?: (pct: number) => void): Promise<UploadResult> {
  const type: 'image' | 'video' = file.type.startsWith('video') ? 'video' : 'image'

  if (IS_DEMO) {
    const id = crypto.randomUUID()
    await putBlob(id, file)
    onProgress?.(100)
    return { url: `idb:${id}`, key: id, type }
  }

  await ensureAuth()
  const cos = getCos()
  const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg')
  const key = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`
  onProgress?.(10)
  await new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: key,
        Body: file,
        onProgress: (info) => onProgress?.(Math.round(info.percent * 100)),
      },
      (err) => (err ? reject(err) : resolve()),
    )
  })
  const url = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${key}`
  onProgress?.(100)
  return { url, key: `cos:${key}`, type }
}

export async function deleteStorageObject(key: string): Promise<void> {
  if (!key) return
  if (key.startsWith('cos:')) {
    const cos = getCos()
    await new Promise<void>((resolve, reject) => {
      cos.deleteObject({ Bucket: COS_BUCKET, Region: COS_REGION, Key: key.slice(4) }, (err) => (err ? reject(err) : resolve()))
    })
    return
  }
  if (key.startsWith('idb:')) {
    await deleteBlob(key.slice(4))
    return
  }
  await tcbApp().storage.from('mzzx').remove([key])
}

const signedCache = new Map<string, string>()

function publicObjectPath(url: string): { bucket: string; path: string } | null {
  const m = url.match(/\/storages\/object\/public\/([^/]+)\/(.+)$/)
  return m ? { bucket: m[1], path: m[2] } : null
}

export function cachedMediaUrl(url: string): string {
  if (url.startsWith('idb:')) return cachedUrl(url.slice(4)) ?? ''
  if (publicObjectPath(url)) return signedCache.get(url) ?? ''
  return url
}

export async function resolveMediaUrl(url: string): Promise<string> {
  if (url.startsWith('idb:')) return resolveIdbUrl(url.slice(4))
  const obj = publicObjectPath(url)
  if (obj) {
    const hit = signedCache.get(url)
    if (hit) return hit
    await ensureAuth()
    const { data, error } = await tcbApp().storage.from(obj.bucket).createSignedUrl(obj.path, 7 * 24 * 3600)
    if (error) throw new Error(error.message)
    signedCache.set(url, data.fullSignedURL)
    return data.fullSignedURL
  }
  return url
}