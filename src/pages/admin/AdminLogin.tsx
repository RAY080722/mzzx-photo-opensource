import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Shield, User } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { IS_DEMO, DEMO_ADMIN_USER, DEMO_ADMIN_PASS } from '@/lib/config'

export function AdminLogin() {
  const login = useStore((s) => s.login)
  const toast = useStore((s) => s.toast)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const ok = await login(user, pass)
    setBusy(false)
    if (!ok) toast('账号或密码错误', 'error')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="glass w-full max-w-sm rounded-3xl p-8"
      >
        <div className="flex flex-col items-center">
          <span className="liquid flex h-14 w-14 items-center justify-center rounded-2xl">
            <Shield className="h-7 w-7 text-[var(--fg)]" />
          </span>
          <h1 className="mt-4 text-xl font-bold">管理后台</h1>
          <p className="mt-1 text-sm text-muted">绵竹中学 · mzzx.photo</p>
        </div>
        <div className="mt-6 space-y-3">
          {IS_DEMO && (
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="管理员账号" className="field pl-9" autoFocus />
            </div>
          )}
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="管理员密码" className="field pl-9" autoFocus={!IS_DEMO} />
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary mt-6 w-full disabled:opacity-60">
          {busy ? '登录中…' : '登录'}
        </button>
        {IS_DEMO && (
          <p className="mt-4 text-center text-xs text-muted">
            演示账号：{DEMO_ADMIN_USER} / {DEMO_ADMIN_PASS}
          </p>
        )}
      </motion.form>
    </div>
  )
}