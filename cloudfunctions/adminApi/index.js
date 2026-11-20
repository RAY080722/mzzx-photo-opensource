const tcb = require('@cloudbase/node-sdk')
const crypto = require('crypto')
const http = require('http')

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV })
const db = app.database()
const _ = db.command

const ADMIN_PASS = process.env.ADMIN_PASS || 'mzzx2027'
const SESSION_TTL = 12 * 60 * 60 * 1000

async function checkSession(token) {
  if (!token) return false
  const res = await db.collection('admin_sessions').where({ token }).get()
  const s = res.data[0]
  return Boolean(s && s.exp > Date.now())
}

async function removePostFiles(post) {
  const keys = [post.media_key, post.thumb_key].filter((k) => typeof k === 'string' && k)
  const cosKeys = keys.filter((k) => k.startsWith('cos:')).map((k) => k.slice(4))
  const tcbKeys = keys.filter((k) => k && !k.startsWith('http') && !k.startsWith('idb:') && !k.startsWith('cos:'))
  if (cosKeys.length) {
    try {
      const Cos = require('cos-nodejs-sdk-v5')
      const cos = new Cos({ SecretId: process.env.COS_SECRET_ID, SecretKey: process.env.COS_SECRET_KEY })
      const BUCKET = process.env.COS_BUCKET || 'ray-1536606545'
      const REGION = process.env.COS_REGION || 'ap-beijing'
      for (const Key of cosKeys) {
        await new Promise((res, rej) => cos.deleteObject({ Bucket: BUCKET, Region: REGION, Key }, (e) => (e ? rej(e) : res())))
      }
    } catch (e) {}
  }
  if (tcbKeys.length) {
    try {
      const st = app.storage()
      if (st && st.from) await st.from(process.env.STORAGE_BUCKET || 'mzzx').remove(tcbKeys)
      else await app.deleteFile({ fileList: tcbKeys })
    } catch (e) {}
  }
}

async function withPostCounts(rows) {
  const [l, c] = await Promise.all([
    db.collection('likes').limit(1000).get(),
    db.collection('comments').limit(1000).get(),
  ])
  const lm = {}
  const cm = {}
  for (const d of l.data) lm[d.post_id] = (lm[d.post_id] || 0) + 1
  for (const d of c.data) cm[d.post_id] = (cm[d.post_id] || 0) + 1
  return rows.map((p) => ({ ...p, likes_count: lm[p._id] || 0, comments_count: cm[p._id] || 0 }))
}

async function handle(event) {
  const { action, token, ...rest } = event || {}
  try {
    if (action === 'login') {
      if (rest.password !== ADMIN_PASS) return { error: '密码错误' }
      const t = crypto.randomUUID()
      await db.collection('admin_sessions').add({ token: t, exp: Date.now() + SESSION_TTL })
      return { token: t }
    }

    // 公开：为访客上传签发 COS 临时密钥（永久密钥仅在函数环境变量中）
    if (action === 'cosSts') {
      const sts = require('qcloud-cos-sts')
      const SECRET_ID = process.env.COS_SECRET_ID
      const SECRET_KEY = process.env.COS_SECRET_KEY
      const BUCKET = process.env.COS_BUCKET || 'ray-1536606545'
      const REGION = process.env.COS_REGION || 'ap-beijing'
      if (!SECRET_ID || !SECRET_KEY) return { error: '未配置 COS 密钥' }
      const policy = {
        version: '2.0',
        statement: [
          {
            action: ['name/cos:PutObject', 'name/cos:PostObject', 'name/cos:DeleteObject'],
            effect: 'allow',
            resource: [`qcs::cos:${REGION}:uid/${BUCKET.split('-').pop()}:${BUCKET}/uploads/*`],
          },
        ],
      }
      const data = await sts.getCredential({ secretId: SECRET_ID, secretKey: SECRET_KEY, policy, durationSeconds: 1800 })
      return { credentials: data.credentials, startTime: data.startTime, expiredTime: data.expiredTime }
    }

    if (!(await checkSession(token))) return { error: '未登录或会话过期' }

    switch (action) {
      case 'listPosts': {
        const { page = 1, pageSize = 10, search, grade, class: cls } = rest
        const cond = {}
        if (search) cond.name = db.RegExp({ regexp: search, options: 'i' })
        if (grade != null) cond.grade = grade
        if (cls != null) cond.class = cls
        const total = (await db.collection('posts').where(cond).count()).total
        const res = await db.collection('posts').where(cond).orderBy('created_at', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
        return { rows: await withPostCounts(res.data), total }
      }
      case 'deletePosts': {
        for (const id of rest.ids || []) {
          const p = (await db.collection('posts').doc(id).get()).data[0]
          if (p) await removePostFiles(p)
          await db.collection('posts').doc(id).remove()
          await db.collection('comments').where({ post_id: id }).remove()
          await db.collection('likes').where({ post_id: id }).remove()
        }
        return { ok: true }
      }
      case 'listComments': {
        const res = await db.collection('comments').orderBy('created_at', 'desc').limit(500).get()
        const lk = await db.collection('comment_likes').limit(1000).get()
        const m = {}
        for (const d of lk.data) m[d.comment_id] = (m[d.comment_id] || 0) + 1
        return { rows: res.data.map((c) => ({ ...c, likes_count: m[c._id] || 0 })) }
      }
      case 'deleteComment': {
        const c = (await db.collection('comments').doc(rest.id).get()).data[0]
        await db.collection('comments').doc(rest.id).remove()
        if (c) {
          await db.collection('posts').doc(c.post_id).update({ comments_count: _.inc(-1) }).catch(() => {})
          if (typeof c.image_url === 'string' && c.image_url.startsWith('tcb:')) {
            await app.deleteFile({ fileList: [c.image_url.slice(4)] }).catch(() => {})
          }
        }
        return { ok: true }
      }
      case 'setFeatured': {
        await db.collection('posts').doc(rest.id).update({ featured: !!rest.featured })
        return { ok: true }
      }
      case 'setThumb': {
        await db.collection('posts').doc(rest.id).update({ thumb_url: rest.thumbUrl, thumb_key: rest.thumbKey })
        return { ok: true }
      }
      case 'signMedia': {
        const urls = rest.urls || []
        try {
          const out = await app.getTempFileURL({ fileList: urls })
          return { fileList: out.fileList }
        } catch (e) {
          const ids = urls.map((u) => {
            const m = String(u).match(/\/storages\/object\/public\/([^/]+)\/(.+)$/)
            return m ? `cloud://${process.env.TCB_ENV}.${m[1]}/${m[2]}` : u
          })
          const out = await app.getTempFileURL({ fileList: ids })
          return { fileList: out.fileList }
        }
      }
      case 'updateSettings': {
        await db.collection('settings').doc('site').set(rest.settings || {})
        return { ok: true }
      }
      default:
        return { error: '未知操作' }
    }
  } catch (e) {
    return { error: String((e && e.message) || e) }
  }
}

// HTTP 服务（新版云函数为 HTTP 型），自带跨域头
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', async () => {
    let event = {}
    try {
      event = JSON.parse(body || '{}')
    } catch {}
    const result = await handle(event)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
  })
})
server.listen(process.env.PORT || 9000)

// 兼容事件调用
exports.main = handle