import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { ToastHost } from '@/components/ui/Toast'
import { UpdateBanner } from '@/components/layout/UpdateBanner'
import { Home } from '@/pages/Home'
import { AdminLogin } from '@/pages/admin/AdminLogin'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'

function AdminRoute() {
  const isAdmin = useStore((s) => s.isAdmin)
  const checkAdmin = useStore((s) => s.checkAdmin)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    checkAdmin().finally(() => setReady(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return <div className="flex min-h-screen items-center justify-center text-sm text-muted">加载中…</div>
  return isAdmin ? <AdminDashboard /> : <AdminLogin />
}

export default function App() {
  const initTheme = useStore((s) => s.initTheme)
  const loadSettings = useStore((s) => s.loadSettings)
  useEffect(() => {
    initTheme()
    void loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <BrowserRouter>
      <ToastHost />
      <UpdateBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}