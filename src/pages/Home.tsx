import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, ChevronRight, Star } from 'lucide-react'
import type { Post, Stats } from '@/types'
import { api } from '@/lib/api'
import { useStore } from '@/store/useStore'
import { Navbar } from '@/components/layout/Navbar'
import { FilterBar } from '@/components/gallery/FilterBar'
import { MasonryGrid } from '@/components/gallery/MasonryGrid'
import { Lightbox } from '@/components/gallery/Lightbox'
import { EmptyState } from '@/components/gallery/EmptyState'
import { PhotoMarquee } from '@/components/gallery/PhotoMarquee'
import { UploadModal } from '@/components/upload/UploadModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CountUp } from '@/components/ui/CountUp'

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const },
}

export function Home() {
  const posts = useStore((s) => s.posts)
  const loading = useStore((s) => s.loading)
  const loadPosts = useStore((s) => s.loadPosts)
  const settings = useStore((s) => s.settings)
  const loadSettings = useStore((s) => s.loadSettings)
  const toast = useStore((s) => s.toast)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<Post | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const marqueeY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.25])

  useEffect(() => {
    void loadSettings()
    void loadPosts()
    api.getStats().then(setStats).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const featured = posts.filter((p) => p.featured)
  const rest = posts.filter((p) => !p.featured)
  const combined = [...featured, ...rest]

  const skipFeatured = () => {
    const el = document.getElementById('wall')
    if (!el) return
    // 懒加载图片会撑高上方瀑布流，落点需持续校正，否则手机上会停在精选里
    const desired = 96
    const align = () => {
      const delta = el.getBoundingClientRect().top - desired
      if (Math.abs(delta) > 4) window.scrollBy({ top: delta, behavior: 'auto' })
    }
    el.scrollIntoView({ behavior: 'auto', block: 'start' })
    align()
    const t0 = Date.now()
    const timer = window.setInterval(() => {
      align()
      if (Date.now() - t0 > 1600) stop()
    }, 120)
    const stop = () => {
      window.clearInterval(timer)
      window.removeEventListener('touchstart', stop)
      window.removeEventListener('wheel', stop)
    }
    window.addEventListener('touchstart', stop, { once: true, passive: true })
    window.addEventListener('wheel', stop, { once: true, passive: true })
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.deletePost(toDelete.id)
      toast('已删除', 'success')
      setToDelete(null)
      await loadPosts()
      api.getStats().then(setStats).catch(() => {})
    } catch (e) {
      toast('删除失败：' + (e as Error).message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar onUpload={() => setUploadOpen(true)} />

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden pt-16 md:pt-24">
        <motion.div style={{ opacity: heroOpacity }} className="container-apple text-center">
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="eyebrow">
            绵竹中学 · mzzx.photo
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08 }} className="hero-h1 mt-3">
            校友影像馆
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.18 }} className="mx-auto mt-5 max-w-xl text-[19px] leading-relaxed text-[var(--fg-muted)] md:text-[21px]">
            上传你的老照片与视频，按年级和班级，找到当年的同学。
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.28 }} className="mt-8 flex items-center justify-center gap-5">
            <button onClick={() => setUploadOpen(true)} className="btn btn-primary">上传照片</button>
            <a href="#gallery" className="btn btn-link flex items-center">
              浏览照片墙 <ChevronRight className="h-4 w-4" />
            </a>
          </motion.div>
        </motion.div>

        <motion.div style={{ y: marqueeY }} className="mt-14 md:mt-20">
          <PhotoMarquee posts={posts} />
        </motion.div>
      </section>

      {/* 数据条 */}
      {stats && (
        <section className="border-y hairline bg-alt">
          <div className="container-apple grid grid-cols-3 gap-4 py-10 text-center">
            {[
              { label: '张照片与视频', value: stats.totalPosts },
              { label: '次点赞', value: stats.totalLikes },
              { label: '条评论', value: stats.totalComments },
            ].map((s) => (
              <motion.div key={s.label} {...reveal}>
                <p className="text-3xl font-bold tracking-tight md:text-5xl">
                  <CountUp value={s.value} />
                </p>
                <p className="mt-1 text-sm text-[var(--fg-muted)]">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 照片墙 */}
      <main id="gallery" className="bg-alt section">
        <div className="container-apple">
          <motion.div {...reveal} className="mb-10 text-center">
            <h2 className="section-h2">照片墙</h2>
            <p className="mx-auto mt-3 max-w-lg text-[17px] text-[var(--fg-muted)]">
              按姓名、年级、班级筛选，找到属于你的青春记忆。
            </p>
          </motion.div>

          <FilterBar />

          {loading && posts.length === 0 ? (
            <div className="masonry">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass-card animate-pulse" style={{ height: `${220 + (i % 3) * 80}px` }} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <EmptyState onUpload={() => setUploadOpen(true)} />
          ) : (
            <>
              {featured.length > 0 && (
                <section className="mb-12">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> 管理员精选
                      <span className="text-sm font-normal text-[var(--fg-muted)]">{featured.length}</span>
                    </h3>
                    <button onClick={skipFeatured} className="btn btn-secondary btn-sm flex items-center gap-1">
                      跳过精选 <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <MasonryGrid posts={featured} onOpen={(i) => setLightbox(i)} onDelete={setToDelete} />
                </section>
              )}

              <section id="wall" className="scroll-mt-24">
                {featured.length > 0 && (
                  <h3 className="mb-5 text-xl font-bold tracking-tight">全部照片</h3>
                )}
                {rest.length === 0 ? (
                  <p className="py-10 text-center text-sm text-[var(--fg-muted)]">精选之外暂无更多照片。</p>
                ) : (
                  <MasonryGrid posts={rest} onOpen={(j) => setLightbox(featured.length + j)} onDelete={setToDelete} />
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <footer className="border-t hairline">
        <div className="container-apple flex flex-col items-center justify-between gap-2 py-8 text-[13px] text-[var(--fg-muted)] sm:flex-row">
          <span>绵竹中学 · mzzx.photo</span>
          <span>用影像留住青春 · {new Date().getFullYear()}</span>
        </div>
      </footer>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <Lightbox posts={combined} index={lightbox} onClose={() => setLightbox(null)} onNavigate={setLightbox} />
      <ConfirmDialog
        open={!!toDelete}
        title="删除这条内容？"
        message="删除后无法恢复，对应的文件也会被移除。"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}