import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, Images, LogOut, MessageSquare, Settings, Shield } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { ContentManager } from '@/components/admin/ContentManager'
import { CommentsManager } from '@/components/admin/CommentsManager'
import { StatsPanel } from '@/components/admin/StatsPanel'
import { SettingsPanel } from '@/components/admin/SettingsPanel'

type Tab = 'content' | 'comments' | 'stats' | 'settings'

const TABS: { key: Tab; label: string; icon: typeof Images }[] = [
  { key: 'content', label: '内容管理', icon: Images },
  { key: 'comments', label: '评论管理', icon: MessageSquare },
  { key: 'stats', label: '数据统计', icon: BarChart3 },
  { key: 'settings', label: '站点设置', icon: Settings },
]

export function AdminDashboard() {
  const logout = useStore((s) => s.logout)
  const checkAdmin = useStore((s) => s.checkAdmin)
  const [tab, setTab] = useState<Tab>('content')

  useEffect(() => {
    void checkAdmin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="liquid flex h-9 w-9 items-center justify-center rounded-xl">
              <Shield className="h-5 w-5 text-[var(--fg)]" />
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">管理后台</p>
              <p className="text-xs text-muted">绵竹中学 · mzzx.photo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden rounded-full px-3 py-2 text-sm text-muted transition hover:bg-white/5 sm:block">返回前台</Link>
            <ThemeToggle />
            <button onClick={() => void logout()} className="glass flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-muted transition hover:text-rose-400" aria-label="退出登录">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <nav className="hidden w-48 shrink-0 md:block">
          <div className="glass sticky top-24 space-y-1 rounded-2xl p-2">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  tab === key ? 'text-[var(--fg)]' : 'text-muted hover:bg-white/5'
                }`}
              >
                {tab === key && (
                  <motion.span layoutId="admin-tab" className="liquid absolute inset-0 rounded-xl" transition={{ type: 'spring', stiffness: 320, damping: 28 }} />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition ${tab === key ? 'liquid text-[var(--fg)]' : 'glass text-muted'}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {tab === 'content' && <ContentManager />}
            {tab === 'comments' && <CommentsManager />}
            {tab === 'stats' && <StatsPanel />}
            {tab === 'settings' && <SettingsPanel />}
          </motion.div>
        </div>
      </div>
    </div>
  )
}