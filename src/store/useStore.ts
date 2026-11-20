import { create } from 'zustand'
import type { Post, Filters, SiteSettings } from '@/types'
import { api } from '@/lib/api'
import { SITE_TITLE_DEFAULT } from '@/lib/config'

type Theme = 'dark' | 'light'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface AppState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
  initTheme: () => void

  filters: Filters
  setFilters: (patch: Partial<Filters>) => void
  resetFilters: () => void

  posts: Post[]
  loading: boolean
  loadPosts: () => Promise<void>

  settings: SiteSettings
  loadSettings: () => Promise<void>

  isAdmin: boolean
  checkAdmin: () => Promise<void>
  login: (u: string, p: string) => Promise<boolean>
  logout: () => Promise<void>

  toasts: Toast[]
  toast: (message: string, type?: Toast['type']) => void
  dismissToast: (id: string) => void
}

const defaultFilters: Filters = { search: '', grade: null, class: null, sort: 'latest' }

function initialTheme(): Theme {
  const saved = localStorage.getItem('mzzx-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return 'light'
}

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark')
  localStorage.setItem('mzzx-theme', t)
}

export const useStore = create<AppState>((set, get) => ({
  theme: initialTheme(),
  initTheme: () => applyTheme(get().theme),
  setTheme: (t) => {
    applyTheme(t)
    set({ theme: t })
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),

  filters: defaultFilters,
  setFilters: (patch) => {
    set({ filters: { ...get().filters, ...patch } })
    void get().loadPosts()
  },
  resetFilters: () => {
    set({ filters: defaultFilters })
    void get().loadPosts()
  },

  posts: [],
  loading: false,
  loadPosts: async () => {
    set({ loading: true })
    try {
      const posts = await api.listPosts(get().filters)
      set({ posts })
    } catch (e) {
      get().toast('加载失败：' + (e as Error).message, 'error')
    } finally {
      set({ loading: false })
    }
  },

  settings: { title: SITE_TITLE_DEFAULT, announcement: '', announcementEnabled: false },
  loadSettings: async () => {
    try {
      set({ settings: await api.getSettings() })
    } catch {
      /* keep default */
    }
  },

  isAdmin: false,
  checkAdmin: async () => set({ isAdmin: await api.isAdmin() }),
  login: async (u, p) => {
    const ok = await api.adminLogin(u, p)
    set({ isAdmin: ok })
    return ok
  },
  logout: async () => {
    await api.adminLogout()
    set({ isAdmin: false })
  },

  toasts: [],
  toast: (message, type = 'info') => {
    const id = crypto.randomUUID()
    set({ toasts: [...get().toasts, { id, message, type }] })
    setTimeout(() => get().dismissToast(id), 3200)
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))