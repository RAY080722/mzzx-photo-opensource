import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ImagePlus, Send, X } from 'lucide-react'
import type { Comment } from '@/types'
import { api } from '@/lib/api'
import { uploadFile } from '@/lib/storage'
import { getProfile, saveProfile } from '@/lib/clientId'
import { useMediaUrl } from '@/hooks/useMediaUrl'
import { useStore } from '@/store/useStore'

function CommentImage({ url }: { url: string }) {
  const src = useMediaUrl(url)
  return src ? <img src={src} alt="评论图片" className="mt-2 max-h-40 rounded-xl object-cover" /> : null
}

function CommentRow({ c }: { c: Comment }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(c.likes_count)
  const toggle = async () => {
    const opt = !liked
    setLiked(opt)
    setCount((n) => n + (opt ? 1 : -1))
    try {
      const r = await api.toggleCommentLike(c.id)
      setLiked(r.liked)
      setCount(r.count)
    } catch {
      setLiked(!opt)
      setCount((n) => n + (opt ? -1 : 1))
    }
  }
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{c.name}</span>
        <button onClick={toggle} className="flex items-center gap-1 text-xs text-muted transition hover:text-accent-400">
          <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-accent-500 text-accent-500' : ''}`} />
          {count}
        </button>
      </div>
      <p className="mt-1 text-sm leading-relaxed">{c.content}</p>
      {c.image_url && <CommentImage url={c.image_url} />}
    </motion.div>
  )
}

export function CommentsPanel({ postId }: { postId: string }) {
  const toast = useStore((s) => s.toast)
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState(() => getProfile().name)
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => api.listComments(postId).then(setComments)
  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  const pickImage = (f: File | null) => {
    setImage(f)
    setPreview(f ? URL.createObjectURL(f) : '')
  }

  const submit = async () => {
    if (!name.trim() || !content.trim()) {
      toast('请填写昵称和评论内容', 'error')
      return
    }
    setSending(true)
    try {
      let image_url: string | undefined
      if (image) image_url = (await uploadFile(image)).url
      await api.addComment({ post_id: postId, name: name.trim(), content: content.trim(), image_url })
      saveProfile({ name: name.trim() })
      setContent('')
      pickImage(null)
      await load()
      toast('评论成功', 'success')
    } catch (e) {
      toast('评论失败：' + (e as Error).message, 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <h4 className="mb-3 text-sm font-semibold text-muted">评论 · {comments.length}</h4>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        <AnimatePresence>
          {comments.map((c) => (
            <CommentRow key={c.id} c={c} />
          ))}
        </AnimatePresence>
        {comments.length === 0 && <p className="py-6 text-center text-sm text-muted">还没有评论，来说点什么吧～</p>}
      </div>
      <div className="mt-3 space-y-2 border-t border-[var(--glass-border)] pt-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="你的昵称" className="field text-sm" />
        <div className="flex gap-2">
          <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="写下你的评论…" className="field text-sm" onKeyDown={(e) => e.key === 'Enter' && submit()} />
          <button onClick={() => fileRef.current?.click()} className="glass flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl text-muted transition hover:text-brand-400" aria-label="添加图片">
            <ImagePlus className="h-5 w-5" />
          </button>
          <button onClick={submit} disabled={sending} className="liquid flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl text-[var(--fg)] transition hover:scale-105 active:scale-95 disabled:opacity-50" aria-label="发送">
            <Send className="h-5 w-5" />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickImage(e.target.files?.[0] ?? null)} />
        {preview && (
          <div className="relative inline-block">
            <img src={preview} alt="待上传" className="h-16 rounded-lg object-cover" />
            <button onClick={() => pickImage(null)} className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-0.5 text-white" aria-label="移除图片">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}