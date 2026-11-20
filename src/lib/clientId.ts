const KEY = 'mzzx-client-id'

export function getClientId(): string {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}

const OWNED = 'mzzx-owned-tokens'

export function rememberToken(postId: string, token: string): void {
  const map = ownedMap()
  map[postId] = token
  localStorage.setItem(OWNED, JSON.stringify(map))
}

export function getOwnedToken(postId: string): string | undefined {
  return ownedMap()[postId]
}

export function forgetToken(postId: string): void {
  const map = ownedMap()
  delete map[postId]
  localStorage.setItem(OWNED, JSON.stringify(map))
}

function ownedMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(OWNED) || '{}')
  } catch {
    return {}
  }
}

const PROFILE = 'mzzx-profile'

export interface Profile {
  name: string
  grade: string
  class: string
}

export function getProfile(): Profile {
  const empty = { name: '', grade: '', class: '' }
  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(PROFILE) || '{}') }
  } catch {
    return empty
  }
}

export function saveProfile(p: Partial<Profile>): void {
  localStorage.setItem(PROFILE, JSON.stringify({ ...getProfile(), ...p }))
}