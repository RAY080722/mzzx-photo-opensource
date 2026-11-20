import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useStore } from '@/store/useStore'

export function ThemeToggle() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const dark = theme === 'dark'
  const busy = useRef(false)

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (busy.current) return
    const next = dark ? 'light' : 'dark'
    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } }

    if (typeof doc.startViewTransition === 'function') {
      busy.current = true
      try {
        const vt = doc.startViewTransition(() => setTheme(next))
        vt.ready
          .then(() => {
            const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
            document.documentElement.animate(
              { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
              { duration: 550, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
            )
          })
          .catch(() => {})
        vt.finished.finally(() => {
          busy.current = false
        })
        setTimeout(() => {
          busy.current = false
        }, 1200)
      } catch {
        busy.current = false
        setTheme(next)
      }
    } else {
      document.documentElement.classList.add('theme-anim')
      setTheme(next)
      setTimeout(() => document.documentElement.classList.remove('theme-anim'), 600)
    }
  }

  return (
    <button
      onClick={onClick}
      aria-label="切换深浅色模式"
      className="liquid relative flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="absolute flex"
          >
            {dark ? <Moon className="h-5 w-5 text-[var(--accent)]" /> : <Sun className="h-5 w-5 text-amber-500" />}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  )
}