// 开源发布：经 api.github.com 建仓并上传整棵文件树（github.com 被墙的网络可用）
// 用法: node scripts/publish-github.mjs  （读根目录 github-token.txt，token 不打印）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const token = fs.readFileSync(path.join(root, 'github-token.txt'), 'utf8').trim()
const API = 'https://api.github.com'
const H = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'mzzx-publish' }

async function api(method, p, body) {
  const r = await fetch(API + p, {
    method,
    headers: { ...H, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${method} ${p} -> ${r.status} ${JSON.stringify(j).slice(0, 200)}`)
  return j
}

const me = await api('GET', '/user')
const owner = me.login
const NAME = 'mzzx-photo'
let repo
try {
  repo = await api('POST', '/user/repos', {
    name: NAME,
    private: false,
    description: '绵竹中学校友照片/视频收集站 · React + CloudBase + COS · 苹果风液态玻璃',
    auto_init: false,
  })
} catch (e) {
  if (e.message.includes('422')) repo = await api('GET', `/repos/${owner}/${NAME}`)
  else throw e
}
console.log('repo:', repo.full_name, 'private:', repo.private)

const EXC_DIRS = new Set(['node_modules', 'dist', '.git', 'shots', '.qoder'])
const EXC = [/\.zip$/, /\.tsbuildinfo$/, /\.tmp$/, /^\.preview-/, /\.qoder\.site/, /^signed-urls\.json$/, /^github-token\.txt$/, /^\.env$/, /\.local$/, /^\.DS_Store$/]
const files = []
function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const relPath = rel + e.name
    if (e.isDirectory()) {
      if (!EXC_DIRS.has(e.name)) walk(path.join(dir, e.name), relPath + '/')
    } else if (!EXC.some((rx) => rx.test(e.name) || rx.test(relPath))) {
      files.push(relPath)
    }
  }
}
walk(root, '')
console.log('files:', files.length)

const tree = []
for (const f of files) {
  const content = fs.readFileSync(path.join(root, f)).toString('base64')
  const blob = await api('POST', `/repos/${owner}/${NAME}/git/blobs`, { content, encoding: 'base64' })
  tree.push({ path: f, mode: '100644', type: 'blob', sha: blob.sha })
}
const t = await api('POST', `/repos/${owner}/${NAME}/git/trees`, { tree })

let parents = []
try {
  const ref = await api('GET', `/repos/${owner}/${NAME}/git/ref/heads/main`)
  parents = [ref.object.sha]
} catch {
  /* 空仓库 */
}
const commit = await api('POST', `/repos/${owner}/${NAME}/git/commits`, {
  message: parents.length ? 'update: sync working tree' : 'open source: 绵竹中学 · mzzx.photo 校友照片墙',
  tree: t.sha,
  parents,
})
if (parents.length) {
  await api('PATCH', `/repos/${owner}/${NAME}/git/refs/heads/main`, { sha: commit.sha })
} else {
  await api('POST', `/repos/${owner}/${NAME}/git/refs`, { ref: 'refs/heads/main', sha: commit.sha })
}
console.log('published:', repo.html_url, 'commit:', commit.sha.slice(0, 7))