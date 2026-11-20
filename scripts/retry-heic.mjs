// 补漏：HEIC（iPhone HEVC）老帖缩略图，sharp/ffmpeg 均不支持时用 heic-convert 解码
// 用法: node scripts/retry-heic.mjs <管理员密码>
import fs from 'node:fs'
import { createRequire } from 'node:module'
import sharp from 'sharp'
import heicConvert from 'heic-convert'

const require = createRequire(new URL('../cloudfunctions/adminApi/package.json', import.meta.url))
const COS = require('cos-nodejs-sdk-v5')

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const API = env.VITE_ADMIN_API_URL
const BUCKET = env.VITE_COS_BUCKET
const REGION = env.VITE_COS_REGION
const PASS = process.argv[2]
if (!PASS) {
  console.error('用法: node scripts/retry-heic.mjs <管理员密码>')
  process.exit(1)
}

async function call(action, rest = {}, token) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token, ...rest }),
  })
  const j = await r.json()
  if (j.error) throw new Error(`${action}: ${j.error}`)
  return j
}

const { token } = await call('login', { password: PASS })
const posts = []
for (let page = 1; ; page++) {
  const { rows, total } = await call('listPosts', { page, pageSize: 100 }, token)
  posts.push(...rows)
  if (posts.length >= total || rows.length === 0) break
}
const targets = posts.filter((p) => !p.thumb_url)
console.log(`targets=${targets.length}`)

const signedMap = JSON.parse(fs.readFileSync(new URL('./signed-urls.json', import.meta.url), 'utf8'))
const sts = await call('cosSts')
const cos = new COS({
  SecretId: sts.credentials.tmpSecretId,
  SecretKey: sts.credentials.tmpSecretKey,
  SecurityToken: sts.credentials.sessionToken,
})
const putObject = (Key, Body) =>
  new Promise((resolve, reject) =>
    cos.putObject({ Bucket: BUCKET, Region: REGION, Key, Body }, (e, d) => (e ? reject(e) : resolve(d))),
  )

for (const p of targets) {
  try {
    const temp = signedMap[p.media_url]
    if (!temp) throw new Error('no signed url')
    const buf = Buffer.from(await (await fetch(temp)).arrayBuffer())
    const jpeg = await heicConvert({ buffer: new Uint8Array(buf), format: 'JPEG', quality: 0.92 })
    const out = await sharp(Buffer.from(jpeg))
      .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer()
    const key = `uploads/thumb-${p._id}-${Date.now()}.jpg`
    await putObject(key, out)
    await call('setThumb', {
      id: p._id,
      thumbUrl: `https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`,
      thumbKey: `cos:${key}`,
    }, token)
    console.log(`${p.name} ok ${Math.round(buf.byteLength / 1024)}KB -> ${Math.round(out.byteLength / 1024)}KB`)
  } catch (e) {
    console.log(`${p.name} FAIL ${e.message || e}`)
  }
}