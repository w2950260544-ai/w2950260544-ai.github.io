// ================================================================
//  main.js — 全局交互
//  深色模式 / 移动端导航 / 首页 / 博客列表 / 文章详情
// ================================================================

/* ===== 深色模式（初始化）===== */
(function () {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById('btn-theme');
  if (!btn) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.textContent = isDark ? '☀' : '🌙';
}

/* ===== 移动端菜单 ===== */
function initMobileNav() {
  const btn = document.getElementById('btn-menu');
  const mobileNav = document.getElementById('mobile-nav');
  if (!btn || !mobileNav) return;
  btn.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    btn.textContent = open ? '✕' : '☰';
  });
}

/* ===== 高亮当前导航 ===== */
function highlightNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
}

/* ===== 工具函数 ===== */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function getCategoryInfo(key) {
  return CATEGORIES[key] || { label: key, color: '#737373' };
}

function renderCatBadge(catKey) {
  const cat = getCategoryInfo(catKey);
  return `<span class="cat-badge">${cat.label}</span>`;
}

function renderTagList(tags) {
  return tags.slice(0, 3).map(t => `<span>${t}</span>`).join('');
}

/* 渲染一行文章（首页 + 博客页通用）*/
function renderPostRow(post) {
  return `
    <article class="post-row" onclick="location.href='post.html?id=${post.id}'">
      <div class="post-row-date">${formatDate(post.date)}</div>
      <div class="post-row-body">
        <div class="post-row-meta">${renderCatBadge(post.category)}</div>
        <h3 class="post-row-title">${post.title}</h3>
        <p class="post-row-summary">${post.summary}</p>
        <div class="post-row-tags">${renderTagList(post.tags)}</div>
      </div>
      <div class="post-row-arrow">→</div>
    </article>
  `;
}

/* ===== 首页：最新 5 篇 ===== */
function initIndex() {
  const grid = document.getElementById('latest-posts');
  if (!grid) return;
  grid.innerHTML = POSTS.slice(0, 5).map(renderPostRow).join('');
}

/* ===== 博客列表 ===== */
function initBlog() {
  const filterBar = document.getElementById('blog-filter');
  const list = document.getElementById('post-list');
  if (!filterBar || !list) return;

  let activeCategory = 'all';

  function renderFilter() {
    const cats = [...new Set(POSTS.map(p => p.category))];
    filterBar.innerHTML = `
      <button class="filter-btn ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">All</button>
      ${cats.map(c => {
        const info = getCategoryInfo(c);
        return `<button class="filter-btn ${activeCategory === c ? 'active' : ''}" data-cat="${c}">${info.label}</button>`;
      }).join('')}
    `;
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        renderFilter();
        renderList();
      });
    });
  }

  function renderList() {
    const filtered = activeCategory === 'all'
      ? POSTS
      : POSTS.filter(p => p.category === activeCategory);

    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">∅</div>暂无该分类文章</div>`;
      return;
    }
    list.innerHTML = filtered.map(renderPostRow).join('');
  }

  renderFilter();
  renderList();
}

/* ===== 文章详情 ===== */
function initPost() {
  const container = document.getElementById('post-container');
  if (!container) return;

  const id = parseInt(new URLSearchParams(location.search).get('id'));
  const post = POSTS.find(p => p.id === id);

  if (!post) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">∅</div>
        <p style="margin-bottom:24px">文章不存在或已被删除</p>
        <a href="blog.html" class="btn btn-outline">返回博客</a>
      </div>`;
    document.title = '文章不存在 — Andy';
    return;
  }

  document.title = `${post.title} — Andy`;

  const idx = POSTS.findIndex(p => p.id === id);
  const prev = POSTS[idx + 1] || null;
  const next = POSTS[idx - 1] || null;

  container.innerHTML = `
    <a href="blog.html" class="post-detail-back fade-up">← Back to Blog</a>

    <header class="post-detail-header fade-up fade-up-1">
      <div class="post-detail-meta">
        <span>${formatDate(post.date)}</span>
        <span class="dot">·</span>
        ${renderCatBadge(post.category)}
      </div>
      <h1 class="post-detail-title">${post.title}</h1>
      <div class="post-detail-tags">${renderTagList(post.tags)}</div>
    </header>

    <article class="post-body fade-up fade-up-2">${post.content}</article>

    <nav class="post-nav-bar">
      <div class="post-nav-card prev ${prev ? '' : 'hidden'}"
           ${prev ? `onclick="location.href='post.html?id=${prev.id}'"` : ''}>
        <div class="post-nav-label">← 上一篇</div>
        <div class="post-nav-title">${prev ? prev.title : ''}</div>
      </div>
      <div class="post-nav-card next ${next ? '' : 'hidden'}"
           ${next ? `onclick="location.href='post.html?id=${next.id}'"` : ''}>
        <div class="post-nav-label">下一篇 →</div>
        <div class="post-nav-title">${next ? next.title : ''}</div>
      </div>
    </nav>
  `;
}

/* ===== 启动 ===== */
document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcon();
  const themeBtn = document.getElementById('btn-theme');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  initMobileNav();
  highlightNav();

  initIndex();
  initBlog();
  initPost();
});
