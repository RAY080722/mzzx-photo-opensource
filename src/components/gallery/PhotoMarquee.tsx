import type { Post } from '@/types'
import { useMediaUrl } from '@/hooks/useMediaUrl'

function Tile({ post }: { post: Post }) {
  const src = useMediaUrl(post.thumb_url || post.media_url)
  if (!src) return <div className="h-44 w-64 shrink-0 rounded-2xl bg-[var(--bg-alt)] md:h-60" />
  return (
    <img
      src={src}
      alt={`${post.name} 的青春记忆`}
      loading="lazy"
      className="h-44 w-auto shrink-0 rounded-2xl object-cover md:h-60"
    />
  )
}

export function PhotoMarquee({ posts }: { posts: Post[] }) {
  const imgs = posts.filter((p) => p.media_type === 'image').slice(0, 14)
  if (imgs.length === 0) return null
  const row = [...imgs, ...imgs]
  return (
    <div className="marquee-mask overflow-hidden py-2">
      <div className="marquee">
        {row.map((p, i) => (
          <Tile key={`${p.id}-${i}`} post={p} />
        ))}
      </div>
    </div>
  )
}