import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CheckCircle2, FileVideo, ImagePlus, Images, UploadCloud, Video, X } from 'lucide-react'
import { GRADES, CLASSES } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { uploadFile } from '@/lib/storage'
import { makeImageThumb, makeVideoThumb, withTimeout } from '@/lib/thumbs'
import { getProfile, saveProfile } from '@/lib/clientId'
import { api } from '@/lib/api'
import { useStore } from '@/store/useStore'

interface Item {
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
}

export function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useStore((s) => s.toast)
  const loadPosts = useStore((s) => s.loadPosts)
  const [name, setName] = useState(() => getProfile().name)
  const [grade, setGrade] = useState(() => getProfile().grade)
  const [cls, setCls] = useState(() => getProfile().class)
  const [items, setItems] = useState<Item[]>([])
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  const albumRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const next: Item[] = []
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image') && !file.type.startsWith('video')) return
      next.push({ file, preview: URL.createObjectURL(file), progress: 0, status: 'pending' })
    })
    setItems((prev) => [...prev, ...next])
  }

  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))

  const reset = () => {
    setItems([])
    setSuccess(false)
    setBusy(false)
  }

  const close = () => {
    if (busy) return
    reset()
    onClose()
  }

  const submit = async () => {
    if (!name.trim()) return toast('请填写姓名', 'error')
    if (!grade) return toast('请选择年级', 'error')
    if (!cls) return toast('请选择班级', 'error')
    if (items.length === 0) return toast('请至少选择一个文件', 'error')
    setBusy(true)
    try {
      for (let i = 0; i < items.length; i++) {
        setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, status: 'uploading' } : it)))
        const res = await uploadFile(items[i].file, (pct) =>
          setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, progress: Math.round(pct * 0.9) } : it))),
        )
        const thumbFile = items[i].file.type.startsWith('video')
          ? await makeVideoThumb(items[i].file)
          : await makeImageThumb(items[i].file)
        const thumb = thumbFile
          ? await withTimeout(
              uploadFile(thumbFile, (pct) =>
                setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, progress: 90 + Math.round(pct * 0.1) } : it))),
              ),
              20_000,
            )
          : null
        await api.createPost({
          name: name.trim(),
          grade: +grade,
          class: +cls,
          media_url: res.url,
          media_type: res.type,
          media_key: res.key,
          ...(thumb ? { thumb_url: thumb.url, thumb_key: thumb.key } : {}),
        })
        setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, status: 'done', progress: 100 } : it)))
      }
      saveProfile({ name: name.trim(), grade, class: cls })
      setSuccess(true)
      await loadPosts()
      toast('上传成功，感谢分享！', 'success')
      setTimeout(close, 1600)
    } catch (e) {
      toast('上传失败：' + (e as Error).message, 'error')
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title="上传青春记忆" maxWidth="max-w-xl" mobileSheet>
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </motion.span>
            <p className="mt-4 text-lg font-semibold">上传成功！</p>
            <p className="text-sm text-muted">你的记忆已汇入星河 ✨</p>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="姓名 *" className="field" />
              <Select
                value={grade === '' ? null : +grade}
                onChange={(v) => setGrade(v == null ? '' : String(v))}
                options={GRADES.map((g) => ({ value: g, label: `${g}级` }))}
                placeholder="年级 *"
                ariaLabel="选择年级"
              />
              <Select
                value={cls === '' ? null : +cls}
                onChange={(v) => setCls(v == null ? '' : String(v))}
                options={CLASSES.map((c) => ({ value: c, label: `${c}班` }))}
                placeholder="班级 *"
                ariaLabel="选择班级"
              />
            </div>

            {/* 移动端上传功能区：相册 / 拍照 / 录像 */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => albumRef.current?.click()}
                className="glass-card flex flex-col items-center gap-2 rounded-2xl py-4 transition active:scale-95 hover:border-brand-500"
              >
                <span className="liquid flex h-11 w-11 items-center justify-center rounded-full text-[var(--fg)]">
                  <Images className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold">相册选择</span>
                <span className="text-[11px] text-muted">可多选</span>
              </button>
              <button
                onClick={() => cameraRef.current?.click()}
                className="glass-card flex flex-col items-center gap-2 rounded-2xl py-4 transition active:scale-95 hover:border-brand-500"
              >
                <span className="liquid flex h-11 w-11 items-center justify-center rounded-full text-[var(--fg)]">
                  <Camera className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold">拍照</span>
                <span className="text-[11px] text-muted">调起相机</span>
              </button>
              <button
                onClick={() => videoRef.current?.click()}
                className="glass-card flex flex-col items-center gap-2 rounded-2xl py-4 transition active:scale-95 hover:border-brand-500"
              >
                <span className="liquid flex h-11 w-11 items-center justify-center rounded-full text-[var(--fg)]">
                  <Video className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold">录像</span>
                <span className="text-[11px] text-muted">调起摄像</span>
              </button>
            </div>

            {/* 桌面端拖拽区 */}
            <button
              onClick={() => albumRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
              className="hidden w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[var(--glass-border)] py-6 text-muted transition hover:border-brand-500 hover:text-brand-400 sm:flex"
            >
              <UploadCloud className="h-8 w-8" />
              <span className="text-sm font-medium">或拖拽照片 / 视频到此处</span>
            </button>

            <input ref={albumRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
            <input ref={videoRef} type="file" accept="video/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />

            {items.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {items.map((it, i) => (
                  <div key={i} className="glass-card relative overflow-hidden rounded-xl">
                    {it.file.type.startsWith('video') ? (
                      <div className="flex aspect-square items-center justify-center bg-white/5"><FileVideo className="h-7 w-7 text-muted" /></div>
                    ) : (
                      <img src={it.preview} alt="" className="aspect-square w-full object-cover" />
                    )}
                    {it.status !== 'done' && (
                      <button onClick={() => removeItem(i)} className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white" aria-label="移除"><X className="h-3.5 w-3.5" /></button>
                    )}
                    {it.status === 'uploading' && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40"><div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${it.progress}%` }} /></div>
                    )}
                    {it.status === 'done' && (
                      <span className="absolute inset-0 flex items-center justify-center bg-emerald-500/25"><CheckCircle2 className="h-6 w-6 text-emerald-300" /></span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button onClick={submit} disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
              <ImagePlus className="h-5 w-5" />
              {busy ? '上传中…' : `上传 ${items.length || ''} 个文件`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}