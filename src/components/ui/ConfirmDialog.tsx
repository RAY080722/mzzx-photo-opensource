import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认删除',
  onConfirm,
  onCancel,
  busy,
}: {
  open: boolean
  title: string
  message: string
  confirmText?: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}) {
  return (
    <Modal open={open} onClose={onCancel} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15">
          <AlertTriangle className="h-7 w-7 text-rose-400" />
        </span>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted">{message}</p>
        <div className="mt-6 flex w-full gap-3">
          <button onClick={onCancel} className="glass flex-1 rounded-xl py-2.5 text-sm font-medium transition hover:bg-white/10">取消</button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onConfirm} disabled={busy} className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60">
            {busy ? '处理中…' : confirmText}
          </motion.button>
        </div>
      </div>
    </Modal>
  )
}