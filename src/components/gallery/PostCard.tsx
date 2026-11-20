import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Play, Star, Trash2, Film } from 'lucide-react'
import type { Post } from '@/types'
import { useMediaUrl } from '@/hooks/useMediaUrl'
import { LikeButton } from './LikeButton'
import { api } from '@/lib/api'

function timeAgo(iso: string): string {
  const diff = Date.now() - +new Date(iso)
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  return new Date(iso).toLocaleDateString('zh-CN')
}

// 滚动呼吸缩放：下方进入略小 → 视口中间最大 → 上方略收（幅度克制）
function useScrollScale(target: React.RefObject<HTMLElement | null>, scaleEl: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const outer = target.current
    const inner = scaleEl.current
    if (!outer || !inner) return
    const update = () => {
      const r = outer.getBoundingClientRect()
      const vh = window.innerHeight
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))
      const s = p < 0.5 ? 0.93 + 0.07 * (p / 0.5) : 1 - 0.04 * ((p - 0.5) / 0.5)
      inner.style.transform = `scale(${s.toFixed(4)})`
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [target, scaleEl])
}

export function PostCard({
  post,
  index,
  onOpen,
  onDelete,
}: {
  post: Post
  index: number
  onOpen: () => void
  onDelete: (post: Post) => void
}) {
  const ref = useRef<HTMLElement>(null)
  const scaleRef = useRef<HTMLDivElement>(null)
  useScrollScale(ref, scaleRef)

  const src = useMediaUrl(post.thumb_url || post.media_url)
  const canDelete = api.canDelete(post)

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), type: 'spring', stiffness: 200, damping: 24 }}
      className="relative"
    >
      <div ref={scaleRef} style={{ willChange: 'transform' }}>
        <div className="glass-card group relative overflow-hidden">
          <button onClick={onOpen} className="relative block w-full overflow-hidden" aria-label={`预览 ${post.name} 的内容`}>
            {post.media_type === 'video' && !post.thumb_url ? (
              <div className="flex aspect-[3/4] w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/[0.03]">
                <Film className="h-10 w-10 text-muted" />
              </div>
            ) : src ? (
              <img
                src={src}
                alt={`${post.name} 上传的照片`}
                loading="lazy"
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="aspect-[4/5] w-full animate-pulse bg-white/5" />
            )}
            {post.media_type === 'video' && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="liquid flex h-14 w-14 items-center justify-center rounded-full transition-transform group-hover:scale-110">
                  <Play className="h-6 w-6 fill-white text-white" />
                </span>
              </span>
            )}
            <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              {post.grade}级 · {post.class}班
            </span>
            {post.featured && (
              <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-1 text-xs font-semibold text-black backdrop-blur">
                <Star className="h-3 w-3 fill-black" /> 精选
              </span>
            )}
          </button>

          <div className="flex items-center justify-between gap-2 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{post.name}</p>
              <p className="text-xs text-muted">{timeAgo(post.created_at)}</p>
            </div>
            <div className="flex shrink-0 items-center">
              <span className="flex items-center gap-1 px-1.5 text-sm text-muted">
                <MessageCircle className="h-4 w-4" />
                {post.comments_count}
              </span>
              <LikeButton postId={post.id} initialCount={post.likes_count} />
              {canDelete && (
                <button
                  onClick={() => onDelete(post)}
                  className="rounded-full p-1.5 text-muted transition hover:bg-rose-500/15 hover:text-rose-400"
                  aria-label="删除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}