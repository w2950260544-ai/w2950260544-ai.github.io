// ============================================================
//  作品数据 — 在这里添加、修改你的项目和作品
//  字段说明：
//    id       : 唯一编号
//    title    : 作品名称
//    desc     : 简短描述
//    tags     : 技术/工具标签数组
//    link     : 项目链接（填 "" 则不显示按钮）
//    github   : GitHub 链接（填 "" 则不显示）
//    image    : 封面图路径（填 "" 使用默认占位图）
//    featured : true 表示置顶展示
// ============================================================

const WORKS = [
  {
    id: 1,
    title: "个人博客网站",
    desc: "你正在看的这个网站。用纯 HTML/CSS/JS 搭建，支持深色模式，包含博客、作品集和关于页面。",
    tags: ["HTML", "CSS", "JavaScript"],
    link: "",
    github: "",
    image: "",
    featured: true,
  },
  {
    id: 2,
    title: "AI Prompt 工具库",
    desc: "收集整理了 100+ 个在实际工作中验证有效的 Prompt 模板，涵盖写作、设计、编程、学习等场景。",
    tags: ["AI", "Prompt Engineering", "效率工具"],
    link: "",
    github: "",
    image: "",
    featured: true,
  },
  {
    id: 3,
    title: "设计灵感收藏夹",
    desc: "用 Notion 搭建的设计参考数据库，收录了 UI 设计、排版、配色等方向的灵感案例，持续更新中。",
    tags: ["设计", "Notion", "UI/UX"],
    link: "",
    github: "",
    image: "",
    featured: false,
  },
  {
    id: 4,
    title: "摄影记录集",
    desc: "用手机记录日常生活中的光线和瞬间。不追求技术，只记录看见的东西。",
    tags: ["摄影", "生活记录"],
    link: "",
    github: "",
    image: "",
    featured: false,
  },
];
