export type MediaType = 'image' | 'video'

export interface Post {
  id: string
  name: string
  grade: number
  class: number
  media_url: string
  media_type: MediaType
  media_key?: string
  thumb_url?: string
  thumb_key?: string
  likes_count: number
  comments_count: number
  created_at: string
  owner_token?: string
  ownerUid?: string
  featured?: boolean
}

export interface Comment {
  id: string
  post_id: string
  name: string
  content: string
  image_url?: string
  likes_count: number
  created_at: string
}

export interface SiteSettings {
  title: string
  announcement: string
  announcementEnabled?: boolean
}

export type SortMode = 'latest' | 'likes'

export interface Filters {
  search: string
  grade: number | null
  class: number | null
  sort: SortMode
}

export interface Stats {
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalVideos: number
  gradeDistribution: { grade: number; count: number }[]
  recent: Post[]
}

export const GRADES = Array.from({ length: 20 }, (_, i) => 2008 + i) // 2008..2027
export const CLASSES = Array.from({ length: 18 }, (_, i) => i + 1) // 1..18