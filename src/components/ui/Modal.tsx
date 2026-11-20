import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  maxWidth?: string
  mobileSheet?: boolean
}

export function Modal({ open, onClose, children, title, maxWidth = 'max-w-lg', mobileSheet = false }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const outerClass = mobileSheet
    ? 'fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4'
    : 'fixed inset-0 z-[80] flex items-center justify-center p-4'

  const panelClass = mobileSheet
    ? 'glass relative z-10 w-full sm:max-w-xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 pb-8'
    : `glass relative z-10 w-full ${maxWidth} max-h-[88vh] overflow-y-auto rounded-3xl p-6`

  const anim = mobileSheet
    ? { initial: { opacity: 0, y: '100%' }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } }
    : { initial: { opacity: 0, scale: 0.92, y: 24 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.92, y: 24 } }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className={outerClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div {...anim} transition={{ type: 'spring', stiffness: 320, damping: 30 }} className={panelClass}>
            {mobileSheet && <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />}
            {title && (
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{title}</h3>
                <button onClick={onClose} className="rounded-full p-1.5 text-muted transition hover:bg-white/10" aria-label="关闭">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}