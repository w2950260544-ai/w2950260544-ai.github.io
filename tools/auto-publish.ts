#!/usr/bin/env bun
/**
 * 安迪同学公众号自动发布脚本
 * 用法: bun auto-publish.ts [YYYY-MM-DD]
 * 默认使用今天的日期
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync, spawnSync } from "child_process";

// ─── 配置 ────────────────────────────────────────────────────
const WECHAT_OUTPUT_DIR = "C:\\Users\\86152\\blog\\tools\\wechat-output";
const WECHAT_API_SCRIPT =
  "C:\\Users\\86152\\.claude\\plugins\\cache\\baoyu-skills\\baoyu-skills\\e6f4cd8a46a6\\skills\\baoyu-post-to-wechat\\scripts\\wechat-api.ts";
const AUTHOR = "Andy";
const THEME = "grace";
const BLOG_BASE_URL = "https://w2950260544-ai.github.io/deck.html";

// ─── 工具函数 ────────────────────────────────────────────────
function log(msg: string) {
  console.log(`[auto-publish] ${msg}`);
}

function notify(title: string, message: string, isError = false) {
  const icon = isError ? "❌" : "✅";
  console.log(`\n${icon} ${title}: ${message}`);
  // Windows Toast 通知
  try {
    const ps = `
Add-Type -AssemblyName System.Windows.Forms
$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Icon = [System.Drawing.SystemIcons]::Information
$notify.Visible = $true
$notify.ShowBalloonTip(5000, '${title.replace(/'/g, "''")}', '${message.replace(/'/g, "''")}', [System.Windows.Forms.ToolTipIcon]::${isError ? "Error" : "Info"})
Start-Sleep -Milliseconds 5500
$notify.Dispose()`;
    spawnSync("powershell", ["-Command", ps], { timeout: 8000 });
  } catch {
    // 通知失败不影响主流程
  }
}

// ─── 解析 copywriting.md ────────────────────────────────────
interface ParsedContent {
  title: string;
  summary: string;
  oneLiner: string;
  keyPoints: string;
  sourceUrl: string;
  imageCount: number;
}

function parseCopywriting(content: string): ParsedContent {
  // 提取标题
  const titleMatch = content.match(/##\s*标题[^\n]*\n([^\n]+)/);
  const title = titleMatch?.[1]?.trim() ?? "数字消费研究日报";

  // 提取摘要
  const summaryMatch = content.match(/##\s*摘要[^\n]*\n([^\n]+)/);
  const summary = summaryMatch?.[1]?.trim() ?? "";

  // 提取代码块内容（方式A的正文）
  const codeBlockMatch = content.match(/```\s*\n([\s\S]*?)```/);
  const codeBlock = codeBlockMatch?.[1] ?? "";

  // 提取一句话概览
  const oneLinerMatch = codeBlock.match(/【一句话概览】\s*\n([^\n【]+)/);
  const oneLiner = oneLinerMatch?.[1]?.trim() ?? title;

  // 提取今日要点
  const keyPointsMatch = codeBlock.match(/【今日要点】\s*\n([\s\S]*?)(?:【|$)/);
  const keyPoints = keyPointsMatch?.[1]?.trim() ?? "";

  // 提取阅读原文链接
  const urlMatch = content.match(/https?:\/\/[^\s\n]+deck\.html[^\s\n]*/);
  const sourceUrl = urlMatch?.[0]?.trim() ?? BLOG_BASE_URL;

  // 检测图片数量（01.png ~ XX.png）
  const imgMatches = content.match(/0\d\.png/g) ?? [];
  const imageCount = imgMatches.length > 0
    ? Math.max(...imgMatches.map(f => parseInt(f)))
    : 6;

  return { title, summary, oneLiner, keyPoints, sourceUrl, imageCount };
}

// ─── 生成 article.md ────────────────────────────────────────
function generateArticleMd(parsed: ParsedContent, folderPath: string): string {
  const { title, summary, oneLiner, keyPoints, sourceUrl, imageCount } = parsed;

  const images = Array.from({ length: imageCount }, (_, i) =>
    `![第 ${i + 1} 页](${String(i + 1).padStart(2, "0")}.png)`
  ).join("\n\n");

  return `---
title: ${title}
description: ${summary || oneLiner}
author: ${AUTHOR}
coverImage: cover.png
contentSourceUrl: ${sourceUrl}
---

**${oneLiner}**

---

## 今日要点

${keyPoints}

---

## 完整 PPT

${images}

---

点击下方「**阅读原文**」查看高清完整版 PPT（含在线翻页）
`;
}

// ─── 主流程 ─────────────────────────────────────────────────
async function main() {
  const dateArg = process.argv[2];
  const today = dateArg ?? new Date().toISOString().slice(0, 10);
  const folderPath = join(WECHAT_OUTPUT_DIR, today);

  log(`目标日期：${today}`);
  log(`内容目录：${folderPath}`);

  // 1. 检查目录是否存在
  if (!existsSync(folderPath)) {
    const msg = `未找到 ${today} 的内容目录，跳过发布`;
    log(msg);
    notify("安迪公众号自动发布", msg, true);
    process.exit(0);
  }

  // 2. 检查封面和图片
  const coverPath = join(folderPath, "cover.png");
  if (!existsSync(coverPath)) {
    const msg = `缺少封面图 cover.png，发布中止`;
    log(msg);
    notify("安迪公众号自动发布", msg, true);
    process.exit(1);
  }

  // 3. 生成 article.md（如果不存在）
  const articlePath = join(folderPath, "article.md");
  if (!existsSync(articlePath)) {
    const copywritingPath = join(folderPath, "copywriting.md");
    if (!existsSync(copywritingPath)) {
      const msg = `既无 article.md 也无 copywriting.md，无法生成文章`;
      log(msg);
      notify("安迪公众号自动发布", msg, true);
      process.exit(1);
    }
    log("article.md 不存在，从 copywriting.md 自动生成...");
    const raw = readFileSync(copywritingPath, "utf-8");
    const parsed = parseCopywriting(raw);
    log(`解析结果 → 标题: ${parsed.title}`);
    const articleMd = generateArticleMd(parsed, folderPath);
    writeFileSync(articlePath, articleMd, "utf-8");
    log(`article.md 已生成：${articlePath}`);
  } else {
    log("article.md 已存在，跳过生成");
  }

  // 4. 调用 wechat-api.ts 发布（execSync 直接继承 stdio，实时打印日志）
  log("开始发布到微信公众号草稿箱...");
  let publishOutput = "";
  try {
    publishOutput = execSync(
      `bun "${WECHAT_API_SCRIPT}" "${articlePath}" --theme ${THEME}`,
      { encoding: "utf-8", timeout: 120_000, stdio: ["inherit", "pipe", "pipe"] }
    );
    process.stdout.write(publishOutput);
  } catch (err: any) {
    const output = (err.stdout ?? "") + (err.stderr ?? "");
    if (output) process.stderr.write(output);
    const msg = `发布失败：${err.message?.split("\n")[0] ?? "未知错误"}`;
    log(msg);
    notify("安迪公众号自动发布", msg, true);
    process.exit(1);
  }

  // 5. 提取 media_id 并通知成功
  const mediaIdMatch = publishOutput.match(/"media_id":\s*"([^"]+)"/);
  const mediaId = mediaIdMatch?.[1] ? `(${mediaIdMatch[1].slice(0, 8)}...)` : "";
  const successMsg = `${today} 文章已推送到草稿箱 ${mediaId}`;
  log(successMsg);
  notify("✅ 安迪公众号自动发布", successMsg);
}

main().catch(err => {
  console.error("[auto-publish] 未捕获异常:", err);
  process.exit(1);
});
