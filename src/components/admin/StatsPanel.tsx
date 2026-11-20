import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Images, MessageSquare, Video } from 'lucide-react'
import type { Stats } from '@/types'
import { api } from '@/lib/api'
import { useMediaUrl } from '@/hooks/useMediaUrl'
import { CountUp } from '@/components/ui/CountUp'

function StatCard({ icon: Icon, label, value, delay }: { icon: typeof Images; label: string; value: number; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="glass-card rounded-2xl p-4">
      <span className="liquid flex h-10 w-10 items-center justify-center rounded-xl">
        <Icon className="h-5 w-5 text-[var(--accent)]" />
      </span>
      <p className="mt-3 text-2xl font-black"><CountUp value={value} /></p>
      <p className="text-xs text-muted">{label}</p>
    </motion.div>
  )
}

function RecentThumb({ url }: { url: string }) {
  const src = useMediaUrl(url)
  return src ? <img src={src} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-white/5" />
}

export function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null)
  useEffect(() => {
    api.getStats().then(setStats)
  }, [])

  if (!stats) return <div className="glass rounded-2xl p-8 text-center text-sm text-muted">加载中…</div>
  const max = Math.max(1, ...stats.gradeDistribution.map((g) => g.count))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Images} label="总上传" value={stats.totalPosts} delay={0} />
        <StatCard icon={Heart} label="总点赞" value={stats.totalLikes} delay={0.05} />
        <StatCard icon={MessageSquare} label="总评论" value={stats.totalComments} delay={0.1} />
        <StatCard icon={Video} label="视频数" value={stats.totalVideos} delay={0.15} />
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="mb-4 text-sm font-semibold text-muted">按年级分布</h3>
        <div className="space-y-2">
          {stats.gradeDistribution.map((g, i) => (
            <div key={g.grade} className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 text-muted">{g.grade}级</span>
              <div className="h-5 flex-1 overflow-hidden rounded-full bg-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(g.count / max) * 100}%` }} transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 20 }} className="h-full rounded-full bg-[var(--accent)]" />
              </div>
              <span className="w-8 shrink-0 text-right font-medium">{g.count}</span>
            </div>
          ))}
          {stats.gradeDistribution.length === 0 && <p className="text-sm text-muted">暂无数据</p>}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="mb-4 text-sm font-semibold text-muted">最近上传</h3>
        <div className="space-y-2">
          {stats.recent.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <RecentThumb url={p.thumb_url || (p.media_type === 'image' ? p.media_url : '')} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name} · {p.grade}级{p.class}班</p>
                <p className="text-xs text-muted">{new Date(p.created_at).toLocaleString('zh-CN')}</p>
              </div>
              <span className="text-xs text-muted">{p.likes_count} 赞</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}