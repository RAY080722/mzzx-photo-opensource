import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { api } from '@/lib/api'
import { useStore } from '@/store/useStore'

export function LikeButton({
  postId,
  initialCount,
  size = 'md',
}: {
  postId: string
  initialCount: number
  size?: 'sm' | 'md'
}) {
  const toast = useStore((s) => s.toast)
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(false)
  const [burst, setBurst] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    api.isLiked(postId).then((v) => alive && setLiked(v))
    return () => {
      alive = false
    }
  }, [postId])

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    const optimistic = !liked
    setLiked(optimistic)
    setCount((c) => c + (optimistic ? 1 : -1))
    if (optimistic) setBurst((b) => b + 1)
    try {
      const res = await api.toggleLike(postId)
      setLiked(res.liked)
      setCount(res.count)
    } catch {
      setLiked(!optimistic)
      setCount((c) => c + (optimistic ? -1 : 1))
      toast('点赞失败', 'error')
    } finally {
      setBusy(false)
    }
  }

  const dim = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  return (
    <button
      onClick={toggle}
      className="relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium transition hover:bg-white/10"
      aria-label="点赞"
    >
      <motion.span whileTap={{ scale: 0.7 }} className="relative flex">
        <Heart className={`${dim} transition-colors ${liked ? 'fill-[#ff375f] text-[#ff375f]' : 'text-[var(--fg-muted)]'}`} />
        <AnimatePresence>
          {burst > 0 && liked && (
            <motion.span
              key={burst}
              initial={{ scale: 0.4, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 rounded-full border-2 border-[#ff375f]"
            />
          )}
        </AnimatePresence>
      </motion.span>
      <motion.span key={count} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className={liked ? 'text-[#ff375f]' : 'text-[var(--fg-muted)]'}>
        {count}
      </motion.span>
    </button>
  )
}