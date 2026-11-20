import { AnimatePresence } from 'framer-motion'
import type { Post } from '@/types'
import { PostCard } from './PostCard'

export function MasonryGrid({
  posts,
  onOpen,
  onDelete,
}: {
  posts: Post[]
  onOpen: (index: number) => void
  onDelete: (post: Post) => void
}) {
  return (
    <div className="masonry">
      <AnimatePresence mode="popLayout">
        {posts.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} onOpen={() => onOpen(i)} onDelete={onDelete} />
        ))}
      </AnimatePresence>
    </div>
  )
}