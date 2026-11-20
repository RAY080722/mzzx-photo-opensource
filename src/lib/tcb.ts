import cloudbase from '@cloudbase/js-sdk'
import { TCB_ENV_ID } from './config'

let app: ReturnType<typeof cloudbase.init> | null = null

export function tcbApp() {
  if (!app) app = cloudbase.init({ env: TCB_ENV_ID })
  return app
}

let authReady: Promise<string> | null = null

export function ensureAuth(): Promise<string> {
  if (!authReady) {
    authReady = (async () => {
      const auth = tcbApp().auth()
      try {
        await auth.signInAnonymously()
      } catch {
        /* ignore */
      }
      try {
        const info = (await auth.getCurrentUser()) as { uid?: string; sub?: string } | null
        return info?.uid ?? info?.sub ?? ''
      } catch {
        return ''
      }
    })()
  }
  return authReady
}

export function db() {
  return tcbApp().database()
}