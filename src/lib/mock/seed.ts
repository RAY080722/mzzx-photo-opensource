import type { Post, Comment } from '@/types'

const img = (seed: string, w = 800, h = 1000) => `https://picsum.photos/seed/${seed}/${w}/${h}`

const VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
]

const NAMES = ['林晓阳', '陈思远', '王雨桐', '李承泽', '赵梦琪', '刘子涵', '周宇航', '吴静怡', '郑浩然', '孙艺萱', '黄俊杰', '徐若曦']

function daysAgo(n: number, h = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(9 + h, (n * 7) % 60, 0, 0)
  return d.toISOString()
}

export function seedPosts(): Post[] {
  const posts: Post[] = []
  const aspects = [[800, 1000], [800, 800], [800, 1100], [800, 600], [800, 900]]
  for (let i = 0; i < 22; i++) {
    const isVideo = i % 9 === 4
    const grade = 2008 + ((i * 3) % 20)
    const cls = 1 + ((i * 5) % 18)
    const [w, h] = aspects[i % aspects.length]
    posts.push({
      id: `seed-${i}`,
      name: NAMES[i % NAMES.length],
      grade,
      class: cls,
      media_url: isVideo ? VIDEOS[i % VIDEOS.length] : img(`mzzx${i}`, w, h),
      media_type: isVideo ? 'video' : 'image',
      thumb_url: isVideo ? img(`mzzxv${i}`, 800, 600) : undefined,
      likes_count: (i * 13 + 7) % 120,
      comments_count: i % 4,
      created_at: daysAgo(i, i % 8),
      owner_token: `seed-token-${i}`,
    })
  }
  return posts
}

export function seedComments(posts: Post[]): Comment[] {
  const comments: Comment[] = []
  const texts = ['这张太有回忆了！', '青春啊，满满的都是回忆', '找到老同学了，开心', '拍得真好', '怀念那段时光', '大家都还好吗']
  let cid = 0
  posts.forEach((p, i) => {
    const n = i % 4
    for (let j = 0; j < n; j++) {
      comments.push({
        id: `seed-c-${cid++}`,
        post_id: p.id,
        name: NAMES[(i + j + 3) % NAMES.length],
        content: texts[(i + j) % texts.length],
        likes_count: (i + j) % 9,
        created_at: daysAgo(i - 1 < 0 ? 0 : i - 1, j),
      })
    }
  })
  return comments
}