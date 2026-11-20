import { Megaphone } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { UPDATE_NOTICE } from '@/lib/config'

export function UpdateBanner() {
  const settings = useStore((s) => s.settings)
  const text = UPDATE_NOTICE || (settings.announcementEnabled ? settings.announcement : '')
  if (!text) return null
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-2 text-center text-sm font-medium text-black">
      <Megaphone className="h-4 w-4 shrink-0" />
      <span>{text}</span>
    </div>
  )
}