// 一次性迁移：为老帖生成轻压缩缩略图（1280px / q82）存入 COS，并写回 thumb_url/thumb_key
// 用法: node scripts/migrate-thumbs.mjs <管理员密码>
import { createRequire } from 'node:module'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import ffmpegPath from 'ffmpeg-static'

const execFileAsync = promisify(execFile)

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
  console.error('用法: node scripts/migrate-thumbs.mjs <管理员密码>')
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
console.log('admin login ok')

const posts = []
for (let page = 1; ; page++) {
  const { rows, total } = await call('listPosts', { page, pageSize: 100 }, token)
  posts.push(...rows)
  if (posts.length >= total || rows.length === 0) break
}
const targets = posts.filter((p) => !p.thumb_url)
console.log(`posts=${posts.length} targets=${targets.length}`)

let sts = null
async function getCos() {
  if (!sts || sts.expiredTime - Date.now() / 1000 < 120) {
    sts = await call('cosSts')
  }
  return new COS({
    SecretId: sts.credentials.tmpSecretId,
    SecretKey: sts.credentials.tmpSecretKey,
    SecurityToken: sts.credentials.sessionToken,
  })
}
function putObject(cos, Key, Body) {
  return new Promise((resolve, reject) =>
    cos.putObject({ Bucket: BUCKET, Region: REGION, Key, Body }, (e, d) => (e ? reject(e) : resolve(d))),
  )
}

const pathOf = (u) => String(u).split('/storages/object/public/')[1] || String(u)
const SIGNED_FILE = new URL('./signed-urls.json', import.meta.url)
const signedMap = fs.existsSync(SIGNED_FILE) ? JSON.parse(fs.readFileSync(SIGNED_FILE, 'utf8')) : {}
async function signBatch(urls) {
  const missing = urls.filter((u) => !signedMap[u])
  if (missing.length) {
    const { fileList } = await call('signMedia', { urls: missing }, token)
    missing.forEach((u, i) => {
      const hit = fileList.find((f) => f.fileID === u || pathOf(f.fileID) === pathOf(u)) || fileList[i]
      if (hit && hit.tempFileURL) signedMap[u] = hit.tempFileURL
    })
  }
  return urls.map((u) => signedMap[u])
}

const failed = []
let done = 0
async function worker(queue) {
  for (const p of queue) {
    try {
      const [temp] = await signBatch([p.media_url])
      if (!temp) throw new Error('sign failed')
      const buf = Buffer.from(await (await fetch(temp)).arrayBuffer())
      let source = buf
      if (p.media_type === 'video') {
        const tmpIn = path.join(os.tmpdir(), `mzzx-${p._id}.mp4`)
        const tmpOut = path.join(os.tmpdir(), `mzzx-${p._id}.jpg`)
        fs.writeFileSync(tmpIn, buf)
        try {
          await execFileAsync(ffmpegPath, ['-ss', '0.5', '-i', tmpIn, '-frames:v', '1', '-q:v', '2', '-y', tmpOut], { timeout: 60_000 })
          source = fs.readFileSync(tmpOut)
        } finally {
          fs.rmSync(tmpIn, { force: true })
          fs.rmSync(tmpOut, { force: true })
        }
      }
      const meta = await sharp(source).metadata()
      let thumbUrl, thumbKey
      if (p.media_type === 'image' && buf.byteLength < 250_000 && (meta.width || 0) <= 1280 && (meta.height || 0) <= 1280) {
        thumbUrl = p.media_url
        thumbKey = p.media_key
      } else {
        const out = await sharp(source)
          .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 82 })
          .toBuffer()
        const key = `uploads/thumb-${p._id}-${Date.now()}.jpg`
        await putObject(await getCos(), key, out)
        thumbUrl = `https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`
        thumbKey = `cos:${key}`
        console.log(`  ${p.name}: ${Math.round(buf.byteLength / 1024)}KB -> ${Math.round(out.byteLength / 1024)}KB`)
      }
      await call('setThumb', { id: p._id, thumbUrl, thumbKey }, token)
      done++
      console.log(`[${done}/${targets.length}] ${p.name} ok`)
    } catch (e) {
      failed.push({ id: p._id, name: p.name, err: String(e.message || e) })
      console.log(`[${done + failed.length}/${targets.length}] ${p.name} FAIL ${e.message || e}`)
    }
  }
}

const queues = [[], [], []]
targets.forEach((p, i) => queues[i % 3].push(p))
await Promise.all(queues.map(worker))
console.log(`done=${done} failed=${failed.length}`)
if (failed.length) console.log(JSON.stringify(failed, null, 2))