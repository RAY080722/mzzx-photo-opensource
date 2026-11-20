# 绵竹中学 · mzzx.photo

> 高端、有动画感的校友照片 / 视频收集网站。记录青春，汇聚时光。
> 苹果官网式克制视觉 + iOS 液态玻璃控件 + 丝滑滚动 / 切换动画，完全响应式。

---

## 一、技术栈

| 层 | 选型 |
| --- | --- |
| 前端框架 | React 19 + Vite 6 + TypeScript |
| 样式 | Tailwind CSS v4（`@tailwindcss/vite`） |
| 动画 | Framer Motion + 滚动驱动微动画 |
| 状态管理 | Zustand |
| 路由 | React Router v7 |
| 图标 | lucide-react |
| 后端 / 数据库 / 登录 | **腾讯云开发 CloudBase**（文档数据库 + 匿名登录 + 管理云函数） |
| 媒体存储 | **腾讯云 COS 付费桶**（`ray-1536606545` / ap-beijing，公有读私有写；上传走云函数签发的 STS 临时密钥） |

**双模式设计**：未填 `VITE_TCB_ENV_ID` 时为**演示模式**（内置种子数据 + 浏览器 IndexedDB），`npm run dev` 即可看完整效果；填入 CloudBase 环境 ID 后无缝切换**真实后端**，校友共享同一面照片墙，业务代码零改动。

---

## 二、需求清单

### 前台（用户端）
- [x] 多文件上传（照片 + 视频），必填姓名 / 年级 / 班级（2008–2027 级、1–18 班）
- [x] 移动端上传功能区：相册选择 / 拍照 / 录像（调起原生相册与相机）+ 底部弹层
- [x] 上传进度条 + 成功动画；媒体存 COS 付费桶
- [x] 上传时自动生成轻压缩缩略图（≤1280px / JPEG q82，照片墙秒开）；视频自动抽帧封面
- [x] 全屏预览默认缩略图，底部「查看原图 / 收起原图」开关加载原画质
- [x] 无封面的老视频显示胶片占位图标（不再破图）
- [x] 瀑布流展示 + 滚动呼吸缩放（下→中最大→上略收）
- [x] 姓名搜索 + 年级 / 班级自定义下拉筛选 + 组合筛选
- [x] 最新 / 最热 分段控件（滑块滑动切换）
- [x] 全屏预览（←/→/Esc、视频播放）
- [x] 点赞（心跳微动画）、评论（文字 + 图片）、评论点赞
- [x] 删除自己上传的内容
- [x] 深 / 浅色切换（圆形扩散丝滑转场 + 降级交叉淡入）
- [x] 顶栏固定简洁；下滑收起、按键弹簧动画搬到右侧悬浮
- [x] 上传时间、空状态引导
- [x] 打赏支持：右侧悬浮 💰 按钮 → 文案说明 → 确认打赏后显示微信收款码

### 后台管理（/admin）
- [x] 登录认证（演示账号密码 / CloudBase 云函数密码 + 会话）
- [x] 内容列表：分页 + 搜索 + 年级 / 班级筛选 + 批量删除（含云存储文件）+ 预览放大（桌面 96px）/ 点击看原图 / 视频内嵌播放
- [x] 评论查看与删除
- [x] 数据统计：总上传 / 点赞 / 评论 / 视频 + 年级分布 + 最近上传（数字滚动）
- [x] 站点设置：标题 / 公告
- [x] 深色模式、加载与确认提示

---

## 三、当前进度

| 模块 | 状态 |
| --- | --- |
| 项目骨架 / 构建 | ✅ |
| 苹果风 + 液态玻璃设计系统 | ✅ |
| 前台 / 后台全部功能与动画 | ✅ |
| 公网部署（Qoder Sites，公开） | ✅ |
| CloudBase 真实后端代码（SDK / 存储 / 云函数 / 安全规则） | ✅ 代码就绪 |
| CloudBase 真实后端（存储+数据库+匿名登录+管理云函数） | ✅ 已上线共享 |
| 媒体迁移到 COS 付费桶（上传 / 公有读 / STS 删除） | ✅ 已上线验证 |
| 新上传轻压缩缩略图 + 查看原图 + 视频占位 | ✅ 已上线验证 |
| 老帖批量补缩略图（202 图 + 7 视频） | ⏳ 脚本就绪，待 `adminApi` 新包部署后运行 |

### 线上地址（公开访问）
- 前台：**https://mzzx-photo-y35b5xju25q.qoder.zone**
- 后台：**https://mzzx-photo-y35b5xju25q.qoder.zone/admin**（演示 `admin / mzzx2027`）

> ✅ 当前线上为**真实共享版**：数据存腾讯云 CloudBase（数据库 + 云开发存储），所有访客共享同一面照片墙。
> 后台 `/admin` 密码 = 云函数 `adminApi` 的环境变量 `ADMIN_PASS`（不再是演示账号）。
> 安全提示：存储 RLS 目前为演示用宽松策略（`mzzx-all` USING/WITH CHECK = true）；正式上线建议收紧 DELETE/UPDATE 为仅文件所有者，并把集合 delete 规则收紧。

---

## 四、目录结构

```
.
├── index.html / vite.config.ts / tsconfig*.json / .env.example
├── public/favicon.svg
├── cloudfunctions/adminApi/      # 管理端云函数（密码+会话守卫，服务端权限）
│   ├── index.js                  # 含 cosSts / signMedia / setThumb / COS 删除
│   └── package.json
├── cloudbase/security-rules.json # 各集合安全规则（控制台粘贴用）
├── scripts/migrate-thumbs.mjs    # 老帖批量补缩略图（sharp + ffmpeg 抽帧）
└── src/
    ├── main.tsx / App.tsx / types.ts
    ├── styles/index.css          # 苹果风主题 + 液态玻璃 + Nudge 变量
    ├── store/useStore.ts         # 主题/筛选/数据/认证/Toast
    ├── hooks/useMediaUrl.ts      # 解析 idb:/tcb: 媒体地址
    ├── lib/
    │   ├── config.ts             # 环境读取 + 模式判定
    │   ├── tcb.ts                # CloudBase init + 匿名登录
    │   ├── storage.ts            # COS 上传/删除 + 老云存储临时链接
    │   ├── thumbs.ts             # 客户端轻压缩缩略图（含移动端超时兜底）
    │   ├── api.ts                # 统一数据 API（演示 / CloudBase 双实现）
    │   ├── clientId.ts           # 演示模式凭证
    │   └── mock/                 # 演示种子数据 / localStorage / IndexedDB
    ├── components/
    │   ├── ui/                   # Modal/Select/ConfirmDialog/Toast/CountUp
    │   ├── layout/               # Navbar(收起+侧悬浮)/ThemeToggle(圆形转场)
    │   ├── gallery/              # FilterBar/PostCard(滚动缩放)/MasonryGrid/Lightbox/LikeButton/PhotoMarquee/EmptyState
    │   ├── comments/             # CommentsPanel
    │   ├── upload/               # UploadModal(相册/拍照/录像)
    │   └── admin/                # ContentManager/CommentsManager/StatsPanel/SettingsPanel
    └── pages/                    # Home / admin(AdminLogin/AdminDashboard)
```

---

## 五、快速开始（演示模式，无需密钥）

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 类型检查 + 产物
```
后台 `/admin` 演示账号 `admin / mzzx2027`。

---

## 六、启用真实后端（腾讯云 CloudBase，全程一个控制台）

1. **建环境**：腾讯云控制台 → 云开发 CloudBase → 新建环境（按量计费即可），记下**环境 ID**。
2. **开匿名登录**：环境 → 身份认证 → 启用「匿名登录」。
3. **建集合**：数据库 → 新建集合：`posts`、`comments`、`likes`、`comment_likes`、`settings`、`admin_sessions`。
4. **设安全规则**：每个集合 → 安全规则，按 [cloudbase/security-rules.json](cloudbase/security-rules.json) 对应粘贴（公开读、登录可写；`settings`/`admin_sessions` 仅云函数可写）。
5. **部署云函数**：云函数 → `adminApi`（HTTP 类型，Nodejs 16.13）→ 函数代码 → 本地上传 zip（根目录含 `index.js`、`scf_bootstrap`、`node_modules`）→ **点「部署」并等待部署成功**；函数配置加环境变量 `ADMIN_PASS`、`COS_SECRET_ID`、`COS_SECRET_KEY`（密钥只放函数环境变量）。
6. **填环境变量**：`.env` 设 `VITE_TCB_ENV_ID`、`VITE_ADMIN_API_URL`、`VITE_COS_BUCKET`、`VITE_COS_REGION`。
7. **构建部署**：`npm run build` 后重新发布站点。上传/点赞/评论即走 CloudBase + COS，校友共享。

> 媒体存 **COS 付费桶**（公有读私有写）：浏览器用云函数 `cosSts` 签发的 STS 临时密钥直传 `uploads/*`；老云存储文件经 `signMedia` 换临时链接读取。
> 安全说明：访客匿名登录后可读 / 上传 / 赞 / 评；`posts` 的 update/delete 安全规则仅归属者生效（非归属者写入静默 0 行），管理端操作一律经 `adminApi`（密码 + 12h 会话）服务端执行。

---

## 七、待沟通 / 后续

- 自定义域名 `mzzx.photo` / `mzxx.photo` 绑定与统一。
- 生产安全规则收紧、评论审核 / 敏感词。
- 包体优化（CloudBase SDK 较大，可做路由级代码分割）。

---

## 八、脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 开发服务器 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览产物 |
| `node scripts/migrate-thumbs.mjs <管理员密码>` | 为老帖批量生成缩略图（sharp + ffmpeg-static）。本环境为 PostgreSQL 内核，旧 node-sdk `getTempFileURL` 不可用：先 `node scripts/signed-relay.mjs` 起本地中继，再在线上页面控制台用 js-sdk `storage.from(bucket).createSignedUrl` 批量预签回传 `scripts/signed-urls.json`，脚本优先读该映射 |
| `node scripts/retry-heic.mjs <管理员密码>` | 补漏 iPhone HEIC 老帖（heic-convert 解码后走同一缩略图管线） |
| `python scripts/pack-adminapi.py` | 生成 adminApi.zip（含 scf_bootstrap 可执行位） |
| `node scripts/publish-github.mjs` | 经 api.github.com 建仓/同步开源仓库（读根目录 github-token.txt，github.com 被墙的网络可用） |

---

## 九、开源

- 许可证：**MIT**（见 [LICENSE](LICENSE)）。
- 克隆即跑：`npm install && npm run dev` 为演示模式（无需任何密钥）；接真实后端见第六节。
- 收款码：`src/assets/donate-qr.jpg` 为站长的微信收款码；部署自己的实例时请替换成你自己的图片。
- 云函数包：仓库不含 `adminApi.zip`（构建产物）。在 `cloudfunctions/adminApi` 内 `npm install` 后运行 `python scripts/pack-adminapi.py` 生成，再按第六节上传部署。
- 老帖缩略图迁移用的 `scripts/signed-urls.json` 属临时凭证，**不入仓库**；按第八节中继流程重新生成。
- 密钥约定：COS SecretId/SecretKey、管理员密码只放云函数环境变量；`.env` 与 `github-token.txt` 均被 gitignore。