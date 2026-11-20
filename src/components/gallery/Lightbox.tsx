import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, MessageCircle, ZoomIn, Loader2 } from 'lucide-react'
import type { Post } from '@/types'
import { useMediaUrl } from '@/hooks/useMediaUrl'
import { LikeButton } from './LikeButton'
import { CommentsPanel } from '@/components/comments/CommentsPanel'

export function Lightbox({
  posts,
  index,
  onClose,
  onNavigate,
}: {
  posts: Post[]
  index: number | null
  onClose: () => void
  onNavigate: (i: number) => void
}) {
  const [showComments, setShowComments] = useState(true)
  const [showOriginal, setShowOriginal] = useState(false)
  const [origLoaded, setOrigLoaded] = useState(false)
  const open = index != null
  const post = open ? posts[index] : null
  const thumbSrc = useMediaUrl(post?.thumb_url || post?.media_url)
  const origSrc = useMediaUrl(post?.media_type === 'image' ? post?.media_url : undefined)
  const videoSrc = useMediaUrl(post?.media_type === 'video' ? post?.media_url : undefined)

  useEffect(() => {
    setShowOriginal(false)
    setOrigLoaded(false)
  }, [post?.id])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNavigate((index! + 1) % posts.length)
      if (e.key === 'ArrowLeft') onNavigate((index! - 1 + posts.length) % posts.length)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, index, posts.length, onClose, onNavigate])

  return (
    <AnimatePresence>
      {open && post && (
        <motion.div
          className="fixed inset-0 z-[90] flex flex-col bg-black/85 backdrop-blur-xl lg:flex-row"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative flex flex-1 items-center justify-center p-4">
            <button onClick={onClose} className="glass absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:scale-105" aria-label="关闭">
              <X className="h-5 w-5" />
            </button>
            <button onClick={() => onNavigate((index! - 1 + posts.length) % posts.length)} className="glass absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white transition hover:scale-110" aria-label="上一张">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button onClick={() => onNavigate((index! + 1) % posts.length)} className="glass absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white transition hover:scale-110 lg:right-[22rem]" aria-label="下一张">
              <ChevronRight className="h-6 w-6" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                className="flex max-h-full max-w-full flex-col items-center"
              >
                {post.media_type === 'video' ? (
                  <video src={videoSrc} controls autoPlay playsInline className="max-h-[72vh] max-w-full rounded-2xl shadow-2xl" />
                ) : (
                  <div className="relative">
                    <img src={thumbSrc} alt={`${post.name} 的内容`} className="max-h-[72vh] max-w-full rounded-2xl object-contain shadow-2xl" />
                    {showOriginal && origSrc && (
                      <img
                        src={origSrc}
                        alt=""
                        onLoad={() => setOrigLoaded(true)}
                        className={`absolute inset-0 h-full w-full rounded-2xl object-contain transition-opacity duration-300 ${origLoaded ? 'opacity-100' : 'opacity-0'}`}
                      />
                    )}
                  </div>
                )}
                <div className="mt-4 flex items-center gap-3 text-white">
                  <span className="font-semibold">{post.name}</span>
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs">{post.grade}级 · {post.class}班</span>
                  <LikeButton postId={post.id} initialCount={post.likes_count} />
                  {post.media_type === 'image' && (
                    <button
                      onClick={() => setShowOriginal((v) => !v)}
                      className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm transition hover:bg-white/25"
                    >
                      {showOriginal ? (
                        origLoaded ? (
                          <>收起原图</>
                        ) : (
                          <><Loader2 className="h-4 w-4 animate-spin" /> 原图加载中…</>
                        )
                      ) : (
                        <><ZoomIn className="h-4 w-4" /> 查看原图</>
                      )}
                    </button>
                  )}
                  <button onClick={() => setShowComments((v) => !v)} className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm lg:hidden">
                    <MessageCircle className="h-4 w-4" /> 评论
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className={`${showComments ? 'flex' : 'hidden'} h-64 w-full shrink-0 border-t border-white/10 bg-black/40 p-4 lg:flex lg:h-auto lg:w-80 lg:border-l lg:border-t-0`}>
            <CommentsPanel postId={post.id} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}