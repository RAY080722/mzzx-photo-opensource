import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Shield, Upload } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { DonateModal } from './DonateModal'
import { useStore } from '@/store/useStore'

const fabSpring = { type: 'spring' as const, stiffness: 320, damping: 24 }

export function Navbar({ onUpload }: { onUpload: () => void }) {
  const title = useStore((s) => s.settings.title)
  const [scrolled, setScrolled] = useState(false)
  const [donateOpen, setDonateOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: scrolled ? '-100%' : 0, opacity: scrolled ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        style={{ pointerEvents: scrolled ? 'none' : 'auto' }}
        className="nav"
      >
        <div className="container-apple flex h-12 items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="liquid flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]">
              <Camera className="h-4 w-4 text-[var(--fg)]" />
            </span>
            <span className="truncate text-sm font-semibold tracking-tight">{title}</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2.5">
            <button onClick={onUpload} className="btn btn-primary btn-sm">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">上传照片</span>
            </button>
            <ThemeToggle />
            <Link to="/admin" aria-label="管理后台" className="text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]">
              <Shield className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* 下滑后顶栏收起，按键悬浮到侧边 */}
      <AnimatePresence>
        {scrolled && (
          <motion.div
            key="fab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-3"
          >
            <motion.button
              initial={{ x: 56, scale: 0.6, opacity: 0 }}
              animate={{ x: 0, scale: 1, opacity: 1 }}
              exit={{ x: 56, scale: 0.6, opacity: 0 }}
              transition={fabSpring}
              onClick={() => setDonateOpen(true)}
              aria-label="打赏支持"
              className="liquid flex h-12 w-12 items-center justify-center rounded-full text-xl transition-transform active:scale-90"
            >
              💰
            </motion.button>
            <motion.button
              initial={{ x: 56, scale: 0.6, opacity: 0 }}
              animate={{ x: 0, scale: 1, opacity: 1 }}
              exit={{ x: 56, scale: 0.6, opacity: 0 }}
              transition={{ ...fabSpring, delay: 0.05 }}
              onClick={onUpload}
              aria-label="上传照片"
              className="liquid flex h-12 w-12 items-center justify-center rounded-full text-[var(--fg)] transition-transform active:scale-90"
            >
              <Upload className="h-5 w-5" />
            </motion.button>
            <motion.div
              initial={{ x: 56, scale: 0.6, opacity: 0 }}
              animate={{ x: 0, scale: 1, opacity: 1 }}
              exit={{ x: 56, scale: 0.6, opacity: 0 }}
              transition={{ ...fabSpring, delay: 0.1 }}
            >
              <ThemeToggle />
            </motion.div>
            <motion.div
              initial={{ x: 56, scale: 0.6, opacity: 0 }}
              animate={{ x: 0, scale: 1, opacity: 1 }}
              exit={{ x: 56, scale: 0.6, opacity: 0 }}
              transition={{ ...fabSpring, delay: 0.15 }}
            >
              <Link
                to="/admin"
                aria-label="管理后台"
                className="liquid flex h-10 w-10 items-center justify-center rounded-full text-[var(--fg-muted)] transition-transform active:scale-90"
              >
                <Shield className="h-[18px] w-[18px]" />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
    </>
  )
}