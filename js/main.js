// ================================================================
//  main.js — 全局交互逻辑
//  包含：深色模式、移动端导航、页面初始化分发
// ================================================================

/* ===== 深色模式 ===== */
(function () {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById('btn-theme');
  if (!btn) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.textContent = isDark ? '☀️' : '🌙';
  btn.setAttribute('aria-label', isDark ? '切换浅色模式' : '切换深色模式');
}

/* ===== 移动端导航 ===== */
function initMobileNav() {
  const btn = document.getElementById('btn-menu');
  const mobileNav = document.getElementById('mobile-nav');
  if (!btn || !mobileNav) return;
  btn.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    btn.textContent = open ? '✕' : '☰';
  });
}

/* ===== 高亮当前导航项 ===== */
function highlightNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === path);
  });
}

/* ===== 工具函数 ===== */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}/${day}`;
}

function getCategoryInfo(key) {
  return CATEGORIES[key] || { label: key, color: '#94a3b8' };
}

function renderCatBadge(catKey) {
  const cat = getCategoryInfo(catKey);
  return `<span class="cat-badge" style="background:${cat.color}1a;color:${cat.color}">${cat.label}</span>`;
}

function renderMiniTags(tags) {
  return tags.map(t => `<span class="mini-tag">${t}</span>`).join('');
}

/* ===== 首页 ===== */
function initIndex() {
  const grid = document.getElementById('latest-posts');
  if (!grid) return;

  const recent = POSTS.slice(0, 6);
  grid.innerHTML = recent.map(post => `
    <article class="post-card fade-up" onclick="location.href='post.html?id=${post.id}'">
      <div class="post-card-top">
        ${renderCatBadge(post.category)}
        <span class="post-date-small">${formatDate(post.date)}</span>
      </div>
      <h3 class="post-card-title">${post.title}</h3>
      <p class="post-card-summary">${post.summary}</p>
      <div class="post-card-tags">${renderMiniTags(post.tags)}</div>
    </article>
  `).join('');
}

/* ===== 博客列表页 ===== */
function initBlog() {
  const filterBar = document.getElementById('blog-filter');
  const list = document.getElementById('post-list');
  if (!filterBar || !list) return;

  let activeCategory = 'all';

  // 渲染筛选栏
  function renderFilter() {
    const cats = [...new Set(POSTS.map(p => p.category))];
    filterBar.innerHTML = `
      <button class="filter-btn ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">全部</button>
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

  // 渲染文章列表
  function renderList() {
    const filtered = activeCategory === 'all'
      ? POSTS
      : POSTS.filter(p => p.category === activeCategory);

    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div>暂无该分类的文章</div>`;
      return;
    }

    list.innerHTML = filtered.map(post => `
      <div class="post-list-item" onclick="location.href='post.html?id=${post.id}'" style="cursor:pointer">
        <div class="post-list-date">${formatDate(post.date)}</div>
        <div class="post-list-body">
          <div class="post-list-meta">
            ${renderCatBadge(post.category)}
          </div>
          <h2 class="post-list-title">${post.title}</h2>
          <p class="post-list-summary">${post.summary}</p>
          <div class="post-list-tags">${renderMiniTags(post.tags)}</div>
        </div>
      </div>
    `).join('');
  }

  renderFilter();
  renderList();
}

/* ===== 文章详情页 ===== */
function initPost() {
  const container = document.getElementById('post-container');
  if (!container) return;

  const params = new URLSearchParams(location.search);
  const id = parseInt(params.get('id'));
  const post = POSTS.find(p => p.id === id);

  if (!post) {
    container.innerHTML = `
      <div style="padding:5rem 0;text-align:center">
        <div style="font-size:3rem;margin-bottom:1rem">😔</div>
        <p style="color:var(--text-muted);margin-bottom:1.5rem">文章不存在或已被删除</p>
        <a href="blog.html" class="btn btn-outline">返回博客</a>
      </div>`;
    document.title = '文章不存在 — Andy';
    return;
  }

  document.title = `${post.title} — Andy`;

  const idx = POSTS.findIndex(p => p.id === id);
  const prev = POSTS[idx + 1] || null;
  const next = POSTS[idx - 1] || null;
  const cat = getCategoryInfo(post.category);

  container.innerHTML = `
    <div class="post-detail-header fade-up">
      <a href="blog.html" class="back-btn">← 返回博客列表</a>
      <div class="post-detail-category">${renderCatBadge(post.category)}</div>
      <h1 class="post-detail-title">${post.title}</h1>
      <div class="post-detail-meta">
        <span>📅 ${formatDate(post.date)}</span>
        <span>🏷 ${post.tags.join(' · ')}</span>
      </div>
    </div>
    <div class="divider"></div>
    <article class="post-body section-sm fade-up fade-up-2">${post.content}</article>
    <div class="post-nav-bar">
      <div class="post-nav-card prev ${prev ? '' : 'hidden'}">
        <div class="post-nav-label">⬅ 上一篇</div>
        <div class="post-nav-card-title" onclick="location.href='post.html?id=${prev ? prev.id : ''}'" style="cursor:pointer">${prev ? prev.title : ''}</div>
      </div>
      <div class="post-nav-card next ${next ? '' : 'hidden'}">
        <div class="post-nav-label">下一篇 ➡</div>
        <div class="post-nav-card-title" onclick="location.href='post.html?id=${next ? next.id : ''}'" style="cursor:pointer">${next ? next.title : ''}</div>
      </div>
    </div>
  `;
}

/* ===== 作品页 ===== */
function initWorks() {
  const grid = document.getElementById('works-grid');
  if (!grid) return;

  const icons = ['💻', '🤖', '🎨', '📷', '📝', '🛠️', '🌐', '⚡'];

  grid.innerHTML = WORKS.map((work, i) => `
    <div class="work-card fade-up" style="animation-delay:${i * 0.07}s">
      <div class="work-card-cover">${icons[i % icons.length]}</div>
      <div class="work-card-body">
        <h3 class="work-card-title">${work.title}</h3>
        <p class="work-card-desc">${work.desc}</p>
        <div class="work-card-tags">${renderMiniTags(work.tags)}</div>
      </div>
      <div class="work-card-actions">
        ${work.link ? `<a href="${work.link}" target="_blank" class="btn btn-primary btn-sm">查看项目 ↗</a>` : ''}
        ${work.github ? `<a href="${work.github}" target="_blank" class="btn btn-outline btn-sm">GitHub</a>` : ''}
        ${!work.link && !work.github ? `<span style="font-size:.8rem;color:var(--text-muted)">即将上线...</span>` : ''}
      </div>
    </div>
  `).join('');
}

/* ===== 入口 ===== */
document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcon();
  initMobileNav();
  highlightNav();

  const themeBtn = document.getElementById('btn-theme');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  initIndex();
  initBlog();
  initPost();
  initWorks();
});
