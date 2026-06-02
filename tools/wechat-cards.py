# -*- coding: utf-8 -*-
"""
公众号素材生成器
================

把一份 PPT 转换为：
  1. 每页 PNG 图片（可直接上传公众号「图文消息」素材库）
  2. 推送文案模板（标题 / 摘要 / 正文 / 阅读原文链接）

使用方法
--------
确保 PPT 已经放在 blog/decks/ 目录下，然后运行：

    python tools/wechat-cards.py 2026-06-02.pptx

会在 tools/wechat-output/2026-06-02/ 下生成：
  - cover.png         （首页大图，公众号封面）
  - 01.png ~ NN.png   （每页一张，9 宫格用前 9 张）
  - copywriting.md    （公众号推文模板，复制粘贴即可）

依赖
----
  pip install python-pptx pillow

  PPT 转图片需要本机装有 PowerPoint 或 LibreOffice。
  优先尝试 PowerPoint（更高保真），自动回退到 LibreOffice。
"""

import os
import sys
import json
import shutil
import subprocess
from pathlib import Path

# Windows 控制台默认 GBK，强制 UTF-8 输出，避免 emoji 报错
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

# ---------- 路径 ----------
BLOG_ROOT = Path(__file__).resolve().parent.parent
DECKS_DIR = BLOG_ROOT / "decks"
DECKS_META = BLOG_ROOT / "data" / "decks.js"
OUTPUT_ROOT = Path(__file__).resolve().parent / "wechat-output"


# ---------- 工具函数 ----------
def find_deck_meta(filename: str) -> dict | None:
    """从 data/decks.js 读出对应 PPT 的元信息。"""
    if not DECKS_META.exists():
        return None
    text = DECKS_META.read_text(encoding="utf-8")
    # 简易解析：匹配 file: "xxx.pptx" 所在的对象块
    import re
    blocks = re.findall(r"\{[^{}]*?file:\s*[\"']([^\"']+)[\"'][^{}]*?\}", text, re.S)
    objects = re.findall(r"\{[^{}]*?\}", text, re.S)
    for obj in objects:
        if f'"{filename}"' in obj or f"'{filename}'" in obj:
            meta = {}
            for key in ("id", "date", "title", "subtitle", "summary", "pages"):
                m = re.search(rf"{key}:\s*[\"']?([^,\n\"']+)[\"']?", obj)
                if m:
                    meta[key] = m.group(1).strip()
            tags_match = re.search(r"tags:\s*\[([^\]]*)\]", obj)
            if tags_match:
                meta["tags"] = [
                    t.strip().strip('"').strip("'")
                    for t in tags_match.group(1).split(",")
                    if t.strip()
                ]
            return meta
    return None


def convert_pptx_to_images(pptx_path: Path, output_dir: Path) -> list:
    """把 PPTX 每页导出成 PNG。返回 PNG 路径列表。"""
    output_dir.mkdir(parents=True, exist_ok=True)
    # 方案 1：尝试 PowerPoint COM（Windows + Office）— 逐页直接导出为 01.png
    try:
        import comtypes.client  # type: ignore
        powerpoint = comtypes.client.CreateObject("Powerpoint.Application")
        deck = powerpoint.Presentations.Open(
            str(pptx_path.absolute()), ReadOnly=1, WithWindow=0
        )
        png_paths = []
        total = deck.Slides.Count
        for i in range(1, total + 1):
            out = output_dir / f"{i:02d}.png"
            # 逐页导出，直接命名，避免中文文件名 / 时间差问题
            deck.Slides(i).Export(str(out.absolute()), "PNG", 1600, 900)
            png_paths.append(out)
            print(f"   · 第 {i}/{total} 页 → {out.name}")
        deck.Close()
        powerpoint.Quit()
        # 第一页复制一份作封面
        if png_paths:
            shutil.copy(png_paths[0], output_dir / "cover.png")
        return png_paths
    except Exception as e:
        print(f"⚠ PowerPoint 导出失败：{e}")

    # 方案 2：回退到 LibreOffice
    try:
        # 先转 PDF，再用 pdf2image
        pdf_path = output_dir / "_tmp.pdf"
        subprocess.run(
            [
                "soffice",
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                str(output_dir),
                str(pptx_path),
            ],
            check=True,
            timeout=120,
        )
        from pdf2image import convert_from_path  # type: ignore
        images = convert_from_path(pdf_path, dpi=144)
        png_paths = []
        for i, img in enumerate(images, 1):
            p = output_dir / f"{i:02d}.png"
            img.save(p, "PNG")
            png_paths.append(p)
        pdf_path.unlink(missing_ok=True)
        return png_paths
    except Exception as e:
        print(f"⚠ LibreOffice 导出也失败：{e}")

    print("❌ 无法转换 PPT 为图片。请安装 Microsoft Office 或 LibreOffice。")
    return []


def rename_slides(output_dir: Path) -> list:
    """把 PowerPoint 导出的图片（Slide1.PNG / 幻灯片1.PNG 等）统一重命名为 01.png。

    兼容中英文版 PowerPoint：只要文件名里含数字就能正确排序。
    """
    def slide_num(f: Path) -> int:
        digits = "".join(c for c in f.stem if c.isdigit())
        return int(digits) if digits else 0

    # 收集所有 PNG，排除已处理的 cover.png 和纯数字命名文件
    files = list(output_dir.glob("*.PNG")) + list(output_dir.glob("*.png"))
    files = [f for f in files if f.stem != "cover" and not f.stem.isdigit()]
    files = sorted(files, key=slide_num)

    paths = []
    for f in files:
        n = slide_num(f)
        new_path = output_dir / f"{n:02d}.png"
        if new_path.exists():
            new_path.unlink()
        f.rename(new_path)
        paths.append(new_path)

    # 第一页复制一份为 cover.png
    if paths:
        shutil.copy(paths[0], output_dir / "cover.png")
    return paths


def generate_copywriting(meta: dict, png_paths: list, output_dir: Path):
    """生成公众号推文模板。"""
    title = meta.get("title", "数字消费研究日报")
    subtitle = meta.get("subtitle", "")
    date = meta.get("date", "")
    summary = meta.get("summary", "")
    tags = meta.get("tags", [])
    deck_id = meta.get("id", "")
    blog_url = f"https://w2950260544-ai.github.io/deck.html?id={deck_id}"

    template = f"""# 公众号推文模板 · {date}

> 📋 直接复制下面的内容到公众号编辑器即可

---

## 标题（< 64 字）
{title}

## 摘要（< 120 字，作为推文卡片描述）
{subtitle}。{summary[:80] + '...' if len(summary) > 80 else summary}

---

## 推送方式建议

### 方式 A：图文消息（推荐）
1. 公众号后台 → 草稿箱 → 新建图文
2. 标题、摘要复制以上
3. 封面图：上传 `cover.png`
4. 正文按以下结构插入：

```
【一句话概览】
{subtitle}

【今日要点】
{summary}

【完整 PPT】
[在此插入图片：01.png ~ 09.png]

▼ 点击「阅读原文」查看高清完整版 PPT
（含下载链接 + 在线翻页）
```

5. 在「阅读原文」字段填入博客链接：
   {blog_url}

### 方式 B：图片消息（更轻量）
1. 公众号后台 → 草稿箱 → 新建图片
2. 一次上传 1-9 张：选择 `01.png` ~ `09.png` 中精华页面
3. 文字说明区域填：

```
{title}

{subtitle}

完整版 → {blog_url}
公众号回复「日报」可获取历史所有 PPT
```

---

## 📁 本次素材清单

- 封面图：`cover.png`
- 全部页面：{len(png_paths)} 张 PNG（01.png ~ {len(png_paths):02d}.png）
- 博客链接：{blog_url}

## 🏷 推荐标签（公众号原创声明 / 话题）
{' '.join(['#' + t for t in tags])}

---

*素材生成于 tools/wechat-output/{date}/，可直接在文件管理器中打开使用。*
"""
    md_path = output_dir / "copywriting.md"
    md_path.write_text(template, encoding="utf-8")
    return md_path


# ---------- 主流程 ----------
def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    pptx_name = sys.argv[1]
    pptx_path = DECKS_DIR / pptx_name
    if not pptx_path.exists():
        print(f"❌ 找不到 PPT 文件：{pptx_path}")
        sys.exit(1)

    print(f"📂 PPT: {pptx_path}")

    # 读取元信息
    meta = find_deck_meta(pptx_name) or {}
    print(f"📋 元信息: {meta.get('title', '（无）')}")

    # 输出目录：以日期或文件名命名
    date_tag = meta.get("date") or pptx_path.stem
    output_dir = OUTPUT_ROOT / date_tag
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. 转换图片
    print(f"\n🖼  开始把 PPT 转换为图片...")
    png_paths = convert_pptx_to_images(pptx_path, output_dir)
    if png_paths:
        print(f"✅ 生成 {len(png_paths)} 张图片 → {output_dir}")
    else:
        print("⚠ 图片生成失败，但文案模板仍会生成。")

    # 2. 生成文案模板
    print(f"\n📝 生成公众号文案模板...")
    md_path = generate_copywriting(meta, png_paths, output_dir)
    print(f"✅ 文案模板 → {md_path}")

    # 3. 提示
    print(f"\n🎉 全部完成！")
    print(f"📁 在文件管理器中打开：{output_dir}")
    print(f"📋 把 copywriting.md 里的内容复制到公众号即可")


if __name__ == "__main__":
    main()
