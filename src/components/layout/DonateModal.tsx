import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Modal } from '@/components/ui/Modal'
import donateQr from '@/assets/donate-qr.jpg'

const step = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.22 },
}

export function DonateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  useEffect(() => {
    if (open) setConfirmed(false)
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title="打赏支持" maxWidth="max-w-sm">
      <AnimatePresence mode="wait" initial={false}>
        {!confirmed ? (
          <motion.div key="intro" {...step} className="text-center">
            <span className="liquid mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl">💰</span>
            <p className="mt-4 text-sm leading-6 text-muted">
              现在我一人承担网站服务器费用，如果大家喜欢可以支持一下我，多少都可以，哪怕是 0.5 元。
            </p>
            <button onClick={() => setConfirmed(true)} className="btn btn-primary mt-5 w-full">
              确认打赏
            </button>
            <p className="mt-3 text-xs text-muted">自愿支持 · 不影响任何功能使用</p>
          </motion.div>
        ) : (
          <motion.div key="qr" {...step} className="text-center">
            <img src={donateQr} alt="微信收款码" className="mx-auto w-full max-w-[280px] rounded-2xl" />
            <p className="mt-4 text-sm font-semibold">扫码支持 · 多少都是心意</p>
            <p className="mt-1 text-xs text-muted">手机上长按图片可保存收款码</p>
            <button onClick={onClose} className="btn mt-4 w-full">
              谢谢你
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}