import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Comment } from '@/types'
import { api } from '@/lib/api'
import { useStore } from '@/store/useStore'
import { useMediaUrl } from '@/hooks/useMediaUrl'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

function CImage({ url }: { url: string }) {
  const src = useMediaUrl(url)
  return src ? <img src={src} alt="" className="mt-1 h-16 rounded-lg object-cover" /> : null
}

export function CommentsManager() {
  const toast = useStore((s) => s.toast)
  const [rows, setRows] = useState<Comment[]>([])
  const [toDelete, setToDelete] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => api.adminListComments().then(setRows).catch(() => toast('加载失败', 'error'))
  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const doDelete = async () => {
    if (!toDelete) return
    setBusy(true)
    try {
      await api.deleteComment(toDelete)
      toast('评论已删除', 'success')
      setToDelete(null)
      await load()
    } catch (e) {
      toast('删除失败：' + (e as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold text-muted">全部评论 · {rows.length}</h2>
      <div className="space-y-2">
        {rows.map((c) => (
          <div key={c.id} className="glass-card flex items-start justify-between gap-3 rounded-xl p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{c.name}</span>
                <span className="text-xs text-muted">{new Date(c.created_at).toLocaleString('zh-CN')}</span>
              </div>
              <p className="mt-1 text-sm">{c.content}</p>
              {c.image_url && <CImage url={c.image_url} />}
            </div>
            <button onClick={() => setToDelete(c.id)} className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-rose-500/15 hover:text-rose-400" aria-label="删除评论"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {rows.length === 0 && <p className="py-8 text-center text-sm text-muted">暂无评论</p>}
      </div>
      <ConfirmDialog open={!!toDelete} title="删除这条评论？" message="操作不可恢复。" busy={busy} onConfirm={doDelete} onCancel={() => setToDelete(null)} />
    </div>
  )
}