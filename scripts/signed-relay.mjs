// 本地中继：接收浏览器预签的临时链接，落盘供 migrate-thumbs.mjs 使用
import http from 'node:http'
import fs from 'node:fs'

const FILE = new URL('./signed-urls.json', import.meta.url)
const map = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {}
const save = () => fs.writeFileSync(FILE, JSON.stringify(map))

http
  .createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }
    if (req.method === 'POST') {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        try {
          const { entries } = JSON.parse(body)
          for (const [u, s] of entries) map[u] = s
          save()
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ count: Object.keys(map).length }))
        } catch (e) {
          res.writeHead(400)
          res.end(String(e))
        }
      })
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ count: Object.keys(map).length }))
  })
  .listen(8787, '127.0.0.1', () => console.log('relay listening on 127.0.0.1:8787'))