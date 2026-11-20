import { motion } from 'framer-motion'
import { ImageOff, Upload } from 'lucide-react'

export function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-24 text-center">
      <motion.span animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="glass flex h-20 w-20 items-center justify-center rounded-3xl">
        <ImageOff className="h-9 w-9 text-muted" />
      </motion.span>
      <h3 className="mt-6 text-lg font-semibold">这里还空空如也</h3>
      <p className="mt-1 max-w-xs text-sm text-muted">还没有符合条件的内容，成为第一个分享青春记忆的人吧！</p>
      <button onClick={onUpload} className="btn btn-primary btn-sm mt-6">
        <Upload className="h-4 w-4" /> 立即上传
      </button>
    </motion.div>
  )
}