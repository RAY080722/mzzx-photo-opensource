import type { Post, Comment, Filters, Stats, SiteSettings, MediaType } from '@/types'
import { IS_DEMO, DEMO_ADMIN_USER, DEMO_ADMIN_PASS, SITE_TITLE_DEFAULT, ADMIN_API_URL } from './config'
import { db, ensureAuth, tcbApp } from './tcb'
import { deleteStorageObject } from './storage'
import { loadDB, saveDB } from './mock/db'
import { deleteBlob } from './mock/mediaStore'
import { getClientId, getOwnedToken, rememberToken, forgetToken } from './clientId'

export interface CreatePostInput {
  name: string
  grade: number
  class: number
  media_url: string
  media_type: MediaType
  media_key: string
  thumb_url?: string
  thumb_key?: string
}

export interface CreateCommentInput {
  post_id: string
  name: string
  content: string
  image_url?: string
}

const ADMIN_TOKEN = 'mzzx-admin-token'
let currentUid = ''

async function uid(): Promise<string> {
  currentUid = await ensureAuth()
  return currentUid
}

function mapPost(d: Record<string, unknown>): Post {
  return { ...(d as object), id: d._id as string } as Post
}
function mapComment(d: Record<string, unknown>): Comment {
  return { ...(d as object), id: d._id as string } as Comment
}

async function adminCall(action: string, payload: Record<string, unknown> = {}) {
  await ensureAuth()
  const token = localStorage.getItem(ADMIN_TOKEN) ?? undefined
  const body = { action, token, ...payload }
  let r: { error?: string } & Record<string, unknown>
  if (ADMIN_API_URL) {
    const res = await fetch(ADMIN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    r = await res.json()
  } else {
    const res = await tcbApp().callFunction({ name: 'adminApi', data: body })
    r = res.result as { error?: string } & Record<string, unknown>
  }
  if (r?.error) throw new Error(r.error)
  return r
}

// 计数实时统计（只写本人文档，适配 READONLY 预设）
async function postCounts() {
  const [l, c] = await Promise.all([
    db().collection('likes').limit(1000).get(),
    db().collection('comments').limit(1000).get(),
  ])
  const likes = new Map<string, number>()
  const comments = new Map<string, number>()
  for (const d of l.data as { post_id: string }[]) likes.set(d.post_id, (likes.get(d.post_id) ?? 0) + 1)
  for (const d of c.data as { post_id: string }[]) comments.set(d.post_id, (comments.get(d.post_id) ?? 0) + 1)
  return { likes, comments }
}

async function commentLikeCounts() {
  const res = await db().collection('comment_likes').limit(1000).get()
  const m = new Map<string, number>()
  for (const d of res.data as { comment_id: string }[]) m.set(d.comment_id, (m.get(d.comment_id) ?? 0) + 1)
  return m
}

function applyFilters(posts: Post[], f: Filters): Post[] {
  let out = posts
  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase()
    out = out.filter((p) => p.name.toLowerCase().includes(q))
  }
  if (f.grade != null) out = out.filter((p) => p.grade === f.grade)
  if (f.class != null) out = out.filter((p) => p.class === f.class)
  out = [...out].sort((a, b) =>
    f.sort === 'likes'
      ? b.likes_count - a.likes_count || +new Date(b.created_at) - +new Date(a.created_at)
      : +new Date(b.created_at) - +new Date(a.created_at),
  )
  return out
}

export const api = {
  // ---------- Posts ----------
  async listPosts(f: Filters): Promise<Post[]> {
    if (IS_DEMO) return applyFilters(loadDB().posts, f)
    await uid()
    const cond: Record<string, unknown> = {}
    if (f.search.trim()) cond.name = db().RegExp({ regexp: f.search.trim(), options: 'i' })
    if (f.grade != null) cond.grade = f.grade
    if (f.class != null) cond.class = f.class
    let q = db().collection('posts').where(cond)
    q = f.sort === 'likes'
      ? q.orderBy('likes_count', 'desc').orderBy('created_at', 'desc')
      : q.orderBy('created_at', 'desc')
    const res = await q.limit(1000).get()
    const posts = (res.data as Record<string, unknown>[]).map(mapPost)
    const { likes, comments } = await postCounts()
    posts.forEach((p) => {
      p.likes_count = likes.get(p.id) ?? 0
      p.comments_count = comments.get(p.id) ?? 0
    })
    return applyFilters(posts, f)
  },

  async createPost(input: CreatePostInput): Promise<Post> {
    if (IS_DEMO) {
      const owner_token = crypto.randomUUID()
      const post: Post = {
        id: crypto.randomUUID(),
        ...input,
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        owner_token,
      }
      loadDB().posts.unshift(post)
      saveDB()
      rememberToken(post.id, owner_token)
      return post
    }
    const u = await uid()
    const doc = { ...input, ownerUid: u, likes_count: 0, comments_count: 0, created_at: new Date().toISOString() }
    const res = await db().collection('posts').add(doc)
    return mapPost({ ...doc, _id: res.id })
  },

  async getPost(id: string): Promise<Post | undefined> {
    if (IS_DEMO) return loadDB().posts.find((p) => p.id === id)
    const res = await db().collection('posts').doc(id).get()
    const d = (res.data as Record<string, unknown>[])[0]
    if (!d) return undefined
    const post = mapPost(d)
    const [l, c] = await Promise.all([
      db().collection('likes').where({ post_id: id }).count(),
      db().collection('comments').where({ post_id: id }).count(),
    ])
    post.likes_count = l.total
    post.comments_count = c.total
    return post
  },

  async deletePost(id: string): Promise<void> {
    if (IS_DEMO) {
      const d = loadDB()
      const post = d.posts.find((p) => p.id === id)
      d.posts = d.posts.filter((p) => p.id !== id)
      d.comments = d.comments.filter((c) => c.post_id !== id)
      saveDB()
      if (post?.media_url.startsWith('idb:')) await deleteBlob(post.media_url.slice(4))
      forgetToken(id)
      return
    }
    const u = await uid()
    const post = await this.getPost(id)
    if (!post || post.ownerUid !== u) throw new Error('无权删除该内容')
    await db().collection('posts').doc(id).remove()
    if (post.media_key) await deleteStorageObject(post.media_key).catch(() => {})
    if (post.thumb_key) await deleteStorageObject(post.thumb_key).catch(() => {})
  },

  canDelete(post: Post, name?: string): boolean {
    if (IS_DEMO) {
      if (getOwnedToken(post.id)) return true
      if (name && post.name === name) return true
      return false
    }
    if (currentUid && post.ownerUid === currentUid) return true
    if (name && post.name === name) return true
    return false
  },

  // ---------- Likes ----------
  async isLiked(postId: string): Promise<boolean> {
    if (IS_DEMO) return (loadDB().likes[postId] ?? []).includes(getClientId())
    await ensureAuth()
    const res = await db().collection('likes').where({ post_id: postId, client_id: getClientId() }).count()
    return res.total > 0
  },

  async toggleLike(postId: string): Promise<{ liked: boolean; count: number }> {
    if (IS_DEMO) {
      const cid = getClientId()
      const d = loadDB()
      const arr = d.likes[postId] ?? []
      const post = d.posts.find((p) => p.id === postId)!
      const has = arr.includes(cid)
      d.likes[postId] = has ? arr.filter((x) => x !== cid) : [...arr, cid]
      post.likes_count = Math.max(0, post.likes_count + (has ? -1 : 1))
      saveDB()
      return { liked: !has, count: post.likes_count }
    }
    const u = await uid()
    const cid = getClientId()
    const existing = await db().collection('likes').where({ post_id: postId, client_id: cid }).get()
    const liked = existing.data.length > 0
    if (liked) {
      await db().collection('likes').doc((existing.data[0] as { _id: string })._id).remove()
    } else {
      await db().collection('likes').add({ post_id: postId, client_id: cid, uid: u, created_at: new Date().toISOString() })
    }
    const n = await db().collection('likes').where({ post_id: postId }).count()
    return { liked: !liked, count: n.total }
  },

  // ---------- Comments ----------
  async listComments(postId: string): Promise<Comment[]> {
    if (IS_DEMO) {
      return loadDB()
        .comments.filter((c) => c.post_id === postId)
        .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
    }
    const res = await db().collection('comments').where({ post_id: postId }).orderBy('created_at', 'asc').limit(500).get()
    const comments = (res.data as Record<string, unknown>[]).map(mapComment)
    const counts = await commentLikeCounts()
    comments.forEach((c) => {
      c.likes_count = counts.get(c.id) ?? 0
    })
    return comments
  },

  async addComment(input: CreateCommentInput): Promise<Comment> {
    if (IS_DEMO) {
      const d = loadDB()
      const comment: Comment = { id: crypto.randomUUID(), ...input, likes_count: 0, created_at: new Date().toISOString() }
      d.comments.push(comment)
      const post = d.posts.find((p) => p.id === input.post_id)
      if (post) post.comments_count++
      saveDB()
      return comment
    }
    await uid()
    const doc = { ...input, likes_count: 0, created_at: new Date().toISOString() }
    const res = await db().collection('comments').add(doc)
    return mapComment({ ...doc, _id: res.id })
  },

  async deleteComment(id: string): Promise<void> {
    if (IS_DEMO) {
      const d = loadDB()
      const c = d.comments.find((x) => x.id === id)
      d.comments = d.comments.filter((x) => x.id !== id)
      if (c) {
        const post = d.posts.find((p) => p.id === c.post_id)
        if (post) post.comments_count = Math.max(0, post.comments_count - 1)
        if (c.image_url?.startsWith('idb:')) await deleteBlob(c.image_url.slice(4))
      }
      saveDB()
      return
    }
    await adminCall('deleteComment', { id })
  },

  async toggleCommentLike(commentId: string): Promise<{ liked: boolean; count: number }> {
    if (IS_DEMO) {
      const cid = getClientId()
      const d = loadDB()
      const arr = d.commentLikes[commentId] ?? []
      const c = d.comments.find((x) => x.id === commentId)!
      const has = arr.includes(cid)
      d.commentLikes[commentId] = has ? arr.filter((x) => x !== cid) : [...arr, cid]
      c.likes_count = Math.max(0, c.likes_count + (has ? -1 : 1))
      saveDB()
      return { liked: !has, count: c.likes_count }
    }
    const u = await uid()
    const cid = getClientId()
    const existing = await db().collection('comment_likes').where({ comment_id: commentId, client_id: cid }).get()
    const liked = existing.data.length > 0
    if (liked) {
      await db().collection('comment_likes').doc((existing.data[0] as { _id: string })._id).remove()
    } else {
      await db().collection('comment_likes').add({ comment_id: commentId, client_id: cid, uid: u, created_at: new Date().toISOString() })
    }
    const n = await db().collection('comment_likes').where({ comment_id: commentId }).count()
    return { liked: !liked, count: n.total }
  },

  // ---------- Stats ----------
  async getStats(): Promise<Stats> {
    let posts: Post[]
    let likeTotal: number
    let commentTotal: number
    if (IS_DEMO) {
      posts = loadDB().posts
      likeTotal = posts.reduce((s, p) => s + p.likes_count, 0)
      commentTotal = loadDB().comments.length
    } else {
      const p = await db().collection('posts').limit(1000).get()
      posts = (p.data as Record<string, unknown>[]).map(mapPost)
      const [l, c] = await Promise.all([
        db().collection('likes').count(),
        db().collection('comments').count(),
      ])
      likeTotal = l.total
      commentTotal = c.total
      const { likes, comments } = await postCounts()
      posts.forEach((pp) => {
        pp.likes_count = likes.get(pp.id) ?? 0
        pp.comments_count = comments.get(pp.id) ?? 0
      })
    }
    const gradeMap = new Map<number, number>()
    posts.forEach((p) => gradeMap.set(p.grade, (gradeMap.get(p.grade) ?? 0) + 1))
    return {
      totalPosts: posts.length,
      totalLikes: likeTotal,
      totalComments: commentTotal,
      totalVideos: posts.filter((p) => p.media_type === 'video').length,
      gradeDistribution: [...gradeMap.entries()].map(([grade, count]) => ({ grade, count })).sort((a, b) => a.grade - b.grade),
      recent: [...posts].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 8),
    }
  },

  // ---------- Settings ----------
  async getSettings(): Promise<SiteSettings> {
    if (IS_DEMO) return loadDB().settings
    try {
      const res = await db().collection('settings').doc('site').get()
      const d = (res.data as Record<string, unknown>[])[0] as unknown as SiteSettings | undefined
      return { title: SITE_TITLE_DEFAULT, announcement: '', announcementEnabled: false, ...(d ?? {}) }
    } catch {
      return { title: SITE_TITLE_DEFAULT, announcement: '', announcementEnabled: false }
    }
  },

  async updateSettings(s: SiteSettings): Promise<void> {
    if (IS_DEMO) {
      loadDB().settings = s
      saveDB()
      return
    }
    await adminCall('updateSettings', { settings: s })
  },

  // ---------- Admin auth ----------
  async adminLogin(user: string, pass: string): Promise<boolean> {
    if (IS_DEMO) {
      const ok = user === DEMO_ADMIN_USER && pass === DEMO_ADMIN_PASS
      if (ok) localStorage.setItem(ADMIN_TOKEN, 'demo')
      return ok
    }
    try {
      const r = await adminCall('login', { password: pass })
      if (r.token) {
        localStorage.setItem(ADMIN_TOKEN, r.token as string)
        return true
      }
      return false
    } catch {
      return false
    }
  },

  async adminLogout(): Promise<void> {
    localStorage.removeItem(ADMIN_TOKEN)
  },

  async isAdmin(): Promise<boolean> {
    return Boolean(localStorage.getItem(ADMIN_TOKEN))
  },

  // ---------- Admin content ----------
  async adminListPosts(opts: { page: number; pageSize: number; search?: string; grade?: number | null; class?: number | null }): Promise<{ rows: Post[]; total: number }> {
    if (IS_DEMO) {
      let rows = loadDB().posts
      if (opts.search?.trim()) rows = rows.filter((p) => p.name.includes(opts.search!.trim()))
      if (opts.grade != null) rows = rows.filter((p) => p.grade === opts.grade)
      if (opts.class != null) rows = rows.filter((p) => p.class === opts.class)
      rows = [...rows].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      const total = rows.length
      return { rows: rows.slice((opts.page - 1) * opts.pageSize, opts.page * opts.pageSize), total }
    }
    const r = await adminCall('listPosts', opts as Record<string, unknown>)
    return { rows: (r.rows as Record<string, unknown>[]).map(mapPost), total: r.total as number }
  },

  async adminDeletePosts(ids: string[]): Promise<void> {
    if (IS_DEMO) {
      for (const id of ids) await this.deletePost(id)
      return
    }
    await adminCall('deletePosts', { ids })
  },

  async adminSetFeatured(id: string, featured: boolean): Promise<void> {
    if (IS_DEMO) {
      const p = loadDB().posts.find((x) => x.id === id)
      if (p) p.featured = featured
      saveDB()
      return
    }
    await adminCall('setFeatured', { id, featured })
  },

  async adminListComments(): Promise<Comment[]> {
    if (IS_DEMO) return [...loadDB().comments].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    const r = await adminCall('listComments')
    return (r.rows as Record<string, unknown>[]).map(mapComment)
  },
}