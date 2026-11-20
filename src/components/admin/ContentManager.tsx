import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, Star, Trash2, Film } from 'lucide-react'
import type { Post } from '@/types'
import { GRADES, CLASSES } from '@/types'
import { api } from '@/lib/api'
import { useStore } from '@/store/useStore'
import { useMediaUrl } from '@/hooks/useMediaUrl'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'

const PAGE_SIZE = 10

function Thumb({ post, onOpen }: { post: Post; onOpen: (p: Post) => void }) {
  const src = useMediaUrl(post.thumb_url || (post.media_type === 'image' ? post.media_url : undefined))
  return (
    <button onClick={() => onOpen(post)} aria-label={`查看 ${post.name} 的内容`} className="block overflow-hidden rounded-lg transition hover:opacity-75">
      {src ? (
        <img src={src} alt="" className="h-14 w-14 rounded-lg object-cover sm:h-24 sm:w-24" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/5 sm:h-24 sm:w-24"><Film className="h-5 w-5 text-muted" /></div>
      )}
    </button>
  )
}

function PreviewBody({ post }: { post: Post }) {
  const src = useMediaUrl(post.media_url)
  if (!src) return <div className="h-64 w-full animate-pulse rounded-xl bg-white/5" />
  return post.media_type === 'video' ? (
    <video src={src} controls playsInline className="mx-auto max-h-[70vh] w-full rounded-xl bg-black" />
  ) : (
    <img src={src} alt={`${post.name} 上传的内容`} className="mx-auto max-h-[70vh] w-auto rounded-xl" />
  )
}

export function ContentManager() {
  const toast = useStore((s) => s.toast)
  const [rows, setRows] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [grade, setGrade] = useState('')
  const [cls, setCls] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState<{ ids: string[] } | null>(null)
  const [preview, setPreview] = useState<Post | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminListPosts({ page, pageSize: PAGE_SIZE, search, grade: grade ? +grade : null, class: cls ? +cls : null })
      setRows(res.rows)
      setTotal(res.total)
    } catch (e) {
      toast('加载失败：' + (e as Error).message, 'error')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, grade, cls])

  useEffect(() => {
    void load()
  }, [load])

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allChecked) rows.forEach((r) => next.delete(r.id))
      else rows.forEach((r) => next.add(r.id))
      return next
    })

  const doDelete = async () => {
    if (!confirm) return
    setBusy(true)
    try {
      await api.adminDeletePosts(confirm.ids)
      toast(`已删除 ${confirm.ids.length} 条内容`, 'success')
      setSelected(new Set())
      setConfirm(null)
      await load()
    } catch (e) {
      toast('删除失败：' + (e as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const toggleFeatured = async (r: Post) => {
    try {
      await api.adminSetFeatured(r.id, !r.featured)
      toast(r.featured ? '已取消精选' : '已设为精选', 'success')
      await load()
    } catch (e) {
      toast('操作失败：' + (e as Error).message, 'error')
    }
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[160px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="搜索姓名…" className="field pl-9" />
        </div>
        <Select
          value={grade === '' ? null : +grade}
          onChange={(v) => { setGrade(v == null ? '' : String(v)); setPage(1) }}
          options={[{ value: null, label: '全部年级' }, ...GRADES.map((g) => ({ value: g, label: `${g}级` }))]}
          placeholder="全部年级"
          ariaLabel="筛选年级"
          className="w-auto"
        />
        <Select
          value={cls === '' ? null : +cls}
          onChange={(v) => { setCls(v == null ? '' : String(v)); setPage(1) }}
          options={[{ value: null, label: '全部班级' }, ...CLASSES.map((c) => ({ value: c, label: `${c}班` }))]}
          placeholder="全部班级"
          ariaLabel="筛选班级"
          className="w-auto"
        />
        {selected.size > 0 && (
          <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={() => setConfirm({ ids: [...selected] })} className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-600">
            <Trash2 className="h-4 w-4" /> 删除选中 ({selected.size})
          </motion.button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--glass-border)] text-left text-xs text-muted">
              <th className="p-2"><input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-[var(--color-brand-500)]" /></th>
              <th className="p-2">预览</th>
              <th className="p-2">姓名</th>
              <th className="p-2">年级班级</th>
              <th className="p-2">类型</th>
              <th className="p-2">点赞</th>
              <th className="p-2">上传时间</th>
              <th className="p-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[var(--glass-border)] transition hover:bg-white/5">
                <td className="p-2"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="h-4 w-4 accent-[var(--color-brand-500)]" /></td>
                <td className="p-2"><Thumb post={r} onOpen={setPreview} /></td>
                <td className="p-2 font-medium">{r.name}</td>
                <td className="p-2 text-muted">{r.grade}级 {r.class}班</td>
                <td className="p-2"><span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{r.media_type === 'video' ? '视频' : '照片'}</span></td>
                <td className="p-2 text-muted">{r.likes_count}</td>
                <td className="p-2 text-xs text-muted">{new Date(r.created_at).toLocaleString('zh-CN')}</td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => toggleFeatured(r)}
                    className={`rounded-lg p-1.5 transition hover:bg-amber-400/15 ${r.featured ? 'text-amber-400' : 'text-muted hover:text-amber-400'}`}
                    aria-label={r.featured ? '取消精选' : '设为精选'}
                    title={r.featured ? '取消精选' : '设为精选'}
                  >
                    <Star className={`h-4 w-4 ${r.featured ? 'fill-amber-400' : ''}`} />
                  </button>
                  <button onClick={() => setConfirm({ ids: [r.id] })} className="rounded-lg p-1.5 text-muted transition hover:bg-rose-500/15 hover:text-rose-400" aria-label="删除"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-muted">暂无内容</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>共 {total} 条{loading && ' · 加载中…'}</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="glass flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-40" aria-label="上一页"><ChevronLeft className="h-4 w-4" /></button>
          <span>{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="glass flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-40" aria-label="下一页"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={`删除 ${confirm?.ids.length ?? 0} 条内容？`}
        message="将同时移除对应的 COS 文件，操作不可恢复。"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setConfirm(null)}
      />

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ? `${preview.name} · ${preview.grade}级${preview.class}班` : undefined}
        maxWidth="max-w-3xl"
      >
        {preview && (
          <div className="space-y-3">
            <PreviewBody post={preview} />
            <p className="text-center text-xs text-muted">
              {preview.media_type === 'video' ? '视频' : '原图'} · {new Date(preview.created_at).toLocaleString('zh-CN')} · {preview.likes_count} 赞
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}