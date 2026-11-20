const DB_NAME = 'mzzx-media'
const STORE = 'blobs'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function putBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function getBlob(id: string): Promise<Blob | undefined> {
  const db = await openDB()
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result as Blob | undefined)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return blob
}

export async function deleteBlob(id: string): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

const urlCache = new Map<string, string>()

export async function resolveIdbUrl(key: string): Promise<string> {
  if (urlCache.has(key)) return urlCache.get(key)!
  const blob = await getBlob(key)
  if (!blob) return ''
  const url = URL.createObjectURL(blob)
  urlCache.set(key, url)
  return url
}

export function cachedUrl(key: string): string | undefined {
  return urlCache.get(key)
}

export function isIdbUrl(url: string): boolean {
  return url.startsWith('idb:')
}

export function idbKey(url: string): string {
  return url.slice(4)
}