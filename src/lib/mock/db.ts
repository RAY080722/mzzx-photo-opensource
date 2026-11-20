import type { Post, Comment, SiteSettings } from '@/types'
import { SITE_TITLE_DEFAULT } from '@/lib/config'
import { seedPosts, seedComments } from './seed'

const KEY = 'mzzx-demo-db-v1'

interface DB {
  posts: Post[]
  comments: Comment[]
  likes: Record<string, string[]> // postId -> clientIds
  commentLikes: Record<string, string[]>
  settings: SiteSettings
}

function fresh(): DB {
  const posts = seedPosts()
  return {
    posts,
    comments: seedComments(posts),
    likes: {},
    commentLikes: {},
    settings: { title: SITE_TITLE_DEFAULT, announcement: '欢迎校友们上传青春记忆，一起把时光拼成星河 ✨', announcementEnabled: false },
  }
}

let cache: DB | null = null

export function loadDB(): DB {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      cache = JSON.parse(raw) as DB
      return cache
    }
  } catch {
    /* ignore */
  }
  cache = fresh()
  saveDB()
  return cache
}

export function saveDB(): void {
  if (cache) localStorage.setItem(KEY, JSON.stringify(cache))
}

export function resetDB(): DB {
  cache = fresh()
  saveDB()
  return cache
}