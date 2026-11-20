import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { api } from '@/lib/api'
import { useStore } from '@/store/useStore'

export function SettingsPanel() {
  const toast = useStore((s) => s.toast)
  const loadSettings = useStore((s) => s.loadSettings)
  const [title, setTitle] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.getSettings().then((s) => {
      setTitle(s.title)
      setAnnouncement(s.announcement)
      setEnabled(Boolean(s.announcementEnabled))
    })
  }, [])

  const save = async () => {
    setBusy(true)
    try {
      await api.updateSettings({ title: title.trim(), announcement: announcement.trim(), announcementEnabled: enabled })
      await loadSettings()
      toast('设置已保存', 'success')
    } catch (e) {
      toast('保存失败：' + (e as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass max-w-xl rounded-2xl p-5">
      <h2 className="mb-4 text-sm font-semibold text-muted">站点设置</h2>

      <label className="mb-1 block text-sm font-medium">网站标题</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="field" />

      <div className="mt-4 flex items-center justify-between">
        <label className="text-sm font-medium">首页公告</label>
        <button
          role="switch"
          aria-checked={enabled}
          aria-label="开启或关闭公告"
          onClick={() => setEnabled((v) => !v)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${enabled ? 'bg-amber-400' : 'border border-[var(--border)] bg-[var(--bg-alt)]'}`}
        >
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>
      <textarea
        value={announcement}
        onChange={(e) => setAnnouncement(e.target.value)}
        rows={3}
        className="field mt-2 resize-none"
        placeholder="公告内容，如：网站正在更新中，敬请期待…"
      />
      <p className="mt-1 text-xs text-muted">开关开启后，访客进入站点即在顶部看到公告条；关闭则隐藏。</p>

      <button onClick={save} disabled={busy} className="btn btn-primary btn-sm mt-5 disabled:opacity-60">
        <Save className="h-4 w-4" /> {busy ? '保存中…' : '保存设置'}
      </button>
    </div>
  )
}