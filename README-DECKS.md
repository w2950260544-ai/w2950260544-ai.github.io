# 数据观察 / Data Watch — 每日 PPT 操作手册

> 这份文档教你以后每天怎么把新的「数字消费研究日报 PPT」加到博客 + 推送公众号。
> 整个流程 **5 分钟** 完成。

---

## 📦 文件结构

```
blog/
├── decks/                  ← PPT 文件存放在这里
│   ├── 2026-06-02.pptx
│   ├── 2026-06-03.pptx
│   └── ...
├── data/
│   └── decks.js            ← PPT 元数据列表（每加一份 PPT 改这个）
├── decks.html              ← 列表页
├── deck.html               ← 详情页（带在线预览 + 下载）
└── tools/
    ├── wechat-cards.py     ← 公众号素材生成脚本
    └── wechat-output/      ← 生成的图片 + 文案模板（不需要 push 到 GitHub）
```

---

## 🔄 日常工作流（5 步，5 分钟）

### Step 1 · 把今天的 PPT 复制到博客仓库

把你今天生成的 PPT 文件，**重命名为日期格式**复制到 `blog/decks/` 目录下：

```
原文件：D:\Claude code\自动规划\数字消费研究日报_20260603.pptx
       ↓
复制到：C:\Users\86152\blog\decks\2026-06-03.pptx
```

> 💡 **命名规范很重要**：必须是 `YYYY-MM-DD.pptx` 格式，否则脚本和导航会乱。

### Step 2 · 在 `data/decks.js` 加一条记录

用 VS Code 或记事本打开 `C:\Users\86152\blog\data\decks.js`，在 `DECKS = [` 后面**第一个位置**（最上方）插入：

```js
{
  id: 2,                          // ⚠️ 比现有最大 id 大 1
  date: "2026-06-03",
  title: "数字消费研究日报 · 2026/06/03",
  subtitle: "一句话概括今天的核心观点（< 30 字）",
  summary: "100~200 字摘要，会显示在列表和详情页。重点提 1-2 个最关键的数据或现象。",
  tags: ["数字消费", "研究日报", "今日关键词"],   // 3-5 个
  pages: 10,                      // PPT 总页数
  file: "2026-06-03.pptx",        // 必须和文件名一模一样
  pdf: ""                         // 暂时留空
},
```

> 💡 **懒人方案**：可以让 Claude 帮你根据 PPT 内容自动生成这条记录。
>   命令：「读 `D:\路径\xxx.pptx`，生成 decks.js 元信息」

### Step 3 · 本地预览检查

双击 `C:\Users\86152\blog\decks.html`，浏览器会打开数据观察页，确认：
- ✅ 新 PPT 出现在列表顶部
- ✅ 点击能进入详情页
- ✅ 在线预览能正常加载（首次可能要等 5-10 秒）

> ⚠️ **重要**：在线预览只有 PPT 上传到 GitHub 之后才能正常显示，本地打开会失败这是正常的。本地只需检查列表和文案。

### Step 4 · 推送到 GitHub

打开 **GitHub Desktop**：
1. 左侧会看到 `decks/2026-06-03.pptx` 和 `data/decks.js` 改动
2. 左下 Summary 框写：`新增 2026-06-03 日报`
3. 点 **Commit to main**
4. 顶部 **Push origin**

等 1-3 分钟，访问 https://w2950260544-ai.github.io/decks.html 查看在线效果。

### Step 5 · 生成公众号素材（可选）

如果你今天想在公众号发推文，在 `blog/` 目录下运行：

```bash
python tools/wechat-cards.py 2026-06-03.pptx
```

脚本会自动生成（位于 `tools/wechat-output/2026-06-03/`）：
- `cover.png` — 封面图（公众号封面用）
- `01.png ~ NN.png` — 每页 PNG 图片
- `copywriting.md` — 公众号推文文案模板（直接复制粘贴）

**手动到公众号后台贴一下**就能发了。

---

## 📱 公众号发推完整流程

公众号「安迪同学」是个人订阅号，无法 API 自动推送（腾讯限制），但可以这样半自动：

```
跑 wechat-cards.py
   ↓
打开 tools/wechat-output/2026-MM-DD/
   ↓
登录公众号 → 创作 → 新的图文
   ├── 标题：从 copywriting.md 复制
   ├── 摘要：从 copywriting.md 复制
   ├── 封面：上传 cover.png
   ├── 正文：按 copywriting.md 的结构插入 01.png ~ 09.png
   └── 阅读原文：粘贴博客链接
   ↓
保存草稿 → 群发
```

> 💡 **加分项**：在公众号后台 → 自动回复 → 关键词回复，
>   设置关键词「日报」 → 自动回复博客链接：
>   `https://w2950260544-ai.github.io/decks.html`

---

## ❓ FAQ

### Q1：公众号在线预览不显示怎么办？
A：检查 3 个地方：
- PPT 文件名是否在 `decks.js` 里写对了
- 文件是否已经 push 到 GitHub（去仓库网址看一下是否有这个文件）
- 等 3 分钟再试（GitHub Pages 部署需要时间）

### Q2：怎么改某一份已发布的 PPT 标题/摘要？
A：直接改 `data/decks.js` 里对应的字段，Commit + Push 即可。
PPT 文件不动，只改文字 30 秒就行。

### Q3：可以一次性上传多份 PPT 吗？
A：可以。把多个文件都复制到 `decks/`，在 `decks.js` 里加多条记录，一次 Push 全部上线。

### Q4：要删除一份 PPT 怎么办？
A：
1. 删除 `decks/xxx.pptx` 文件
2. 删除 `decks.js` 里对应的那一条记录
3. Commit + Push

### Q5：PPT 文件太大，影响网站速度吗？
A：单文件建议控制在 5MB 以内。PPT 通常 1-3MB 没问题。
如果太大，可以：
- 压缩 PPT（PowerPoint → 文件 → 压缩图片）
- 改用 PDF 格式（小很多）

### Q6：能不能让 Claude 自动帮我做 Step 1~4？
A：可以。下次只要告诉 Claude：「@PPT路径，自动加到博客」
Claude 会做完全部步骤，你只需要在 GitHub Desktop 点 Push。

---

## 🎯 终极目标

每天 10 分钟内完成：
- ✅ PPT 自动生成（你现有的脚本）
- ✅ 博客自动更新（本流程）
- ✅ 公众号半自动推送（wechat-cards.py + 手动贴）

**形成「研究 → 输出 → 传播」的个人内容飞轮** 🚀

---

*Last updated: 2026-06-03 · Andy*
