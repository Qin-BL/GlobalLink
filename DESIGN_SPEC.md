# 设计规范文档（Design Specification Document）

## 1. 设计概述

### 1.1 设计理念
- **核心理念**：现代简约游戏化设计，通过卡片布局和游戏化元素提升学习体验
- **设计原则**：简约而不简单，功能明确，交互友好，视觉统一
- **用户体验目标**：让英语学习变得有趣、高效、有成就感

### 1.2 目标用户
- **主要用户**：18-35岁的中文用户，英语初学者和进阶者
- **使用场景**：碎片化时间学习，通勤、工作间隙、居家学习
- **设备环境**：桌面端、平板、手机多设备适配

### 1.3 设计策略
- **保持现有风格**：延续现代简约游戏化风格，维护品牌一致性
- **问题导向**：重点解决首页布局、导航拥挤、主题切换等关键问题
- **体验优先**：以用户学习体验为核心，优化交互流程
- **响应式设计**：确保多设备完美适配

## 2. 视觉设计规范

### 2.1 色彩系统

#### 2.1.1 主色调
```css
/* 主品牌色 - 深蓝色系 */
--primary-50: #eff6ff
--primary-100: #dbeafe
--primary-200: #bfdbfe
--primary-300: #93c5fd
--primary-400: #60a5fa
--primary-500: #3b82f6  /* 主色调 */
--primary-600: #2563eb
--primary-700: #1d4ed8
--primary-800: #1e40af
--primary-900: #1e3a8a
```

#### 2.1.2 辅助色彩
```css
/* 成功色 - 绿色系 */
--success-50: #f0fdf4
--success-500: #22c55e
--success-700: #15803d

/* 警告色 - 黄色系 */
--warning-50: #fffbeb
--warning-500: #f59e0b
--warning-700: #a16207

/* 错误色 - 红色系 */
--error-50: #fef2f2
--error-500: #ef4444
--error-700: #b91c1c

/* 信息色 - 紫色系 */
--info-50: #faf5ff
--info-500: #8b5cf6
--info-700: #7c3aed
```

#### 2.1.3 中性色系
```css
/* 深色主题 */
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db
--gray-400: #9ca3af
--gray-500: #6b7280
--gray-600: #4b5563
--gray-700: #374151
--gray-800: #1f2937
--gray-900: #111827

/* 深色主题背景色 */
--dark-bg-primary: #0f172a
--dark-bg-secondary: #1e293b
--dark-bg-tertiary: #334155
```

#### 2.1.4 游戏化色彩
```css
/* 学习模块特色色彩 */
--word-blitz: #f59e0b      /* 词汇训练 - 橙色 */
--sentence-builder: #8b5cf6 /* 语法练习 - 紫色 */
--speech-practice: #06b6d4  /* 口语练习 - 青色 */
--course-center: #10b981    /* 课程中心 - 绿色 */
```

### 2.2 字体规范

#### 2.2.1 字体族
```css
/* 中文字体 */
--font-chinese: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif

/* 英文字体 */
--font-english: "Inter", "Helvetica Neue", Arial, sans-serif

/* 等宽字体 */
--font-mono: "SF Mono", Monaco, "JetBrains Mono", monospace

/* 数字字体 */
--font-numeric: "SF Pro Display", "Inter", sans-serif
```

#### 2.2.2 字号体系
```css
/* 标题字号 */
--text-xs: 0.75rem      /* 12px */
--text-sm: 0.875rem     /* 14px */
--text-base: 1rem       /* 16px */
--text-lg: 1.125rem     /* 18px */
--text-xl: 1.25rem      /* 20px */
--text-2xl: 1.5rem      /* 24px */
--text-3xl: 1.875rem    /* 30px */
--text-4xl: 2.25rem     /* 36px */
--text-5xl: 3rem        /* 48px */

/* 行高比例 */
--leading-tight: 1.25
--leading-normal: 1.5
--leading-relaxed: 1.75
```

#### 2.2.3 字重规范
```css
--font-light: 300
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
--font-extrabold: 800
```

### 2.3 布局系统

#### 2.3.1 栅格系统
```css
/* 容器宽度 */
--container-sm: 640px
--container-md: 768px
--container-lg: 1024px
--container-xl: 1280px
--container-2xl: 1536px

/* 栅格间距 */
--gap-1: 0.25rem    /* 4px */
--gap-2: 0.5rem     /* 8px */
--gap-3: 0.75rem    /* 12px */
--gap-4: 1rem       /* 16px */
--gap-6: 1.5rem     /* 24px */
--gap-8: 2rem       /* 32px */
--gap-12: 3rem      /* 48px */
--gap-16: 4rem      /* 64px */
```

#### 2.3.2 间距规范
```css
/* 内边距 */
--padding-xs: 0.5rem    /* 8px */
--padding-sm: 0.75rem   /* 12px */
--padding-md: 1rem      /* 16px */
--padding-lg: 1.5rem    /* 24px */
--padding-xl: 2rem      /* 32px */
--padding-2xl: 3rem     /* 48px */

/* 外边距 */
--margin-xs: 0.5rem     /* 8px */
--margin-sm: 0.75rem    /* 12px */
--margin-md: 1rem       /* 16px */
--margin-lg: 1.5rem     /* 24px */
--margin-xl: 2rem       /* 32px */
--margin-2xl: 3rem      /* 48px */
```

#### 2.3.3 圆角规范
```css
--rounded-sm: 0.125rem    /* 2px */
--rounded-md: 0.375rem    /* 6px */
--rounded-lg: 0.5rem      /* 8px */
--rounded-xl: 0.75rem     /* 12px */
--rounded-2xl: 1rem       /* 16px */
--rounded-3xl: 1.5rem     /* 24px */
--rounded-full: 9999px
```

#### 2.3.4 阴影系统
```css
/* 卡片阴影 */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)

/* 悬浮效果 */
--shadow-hover: 0 25px 50px -12px rgb(0 0 0 / 0.25)

/* 深色主题阴影 */
--shadow-dark: 0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)
```

## 3. 交互设计规范

### 3.1 导航系统

#### 3.1.1 主导航设计
```css
/* 顶部导航栏 */
.main-nav {
  height: 64px;
  background: var(--dark-bg-secondary);
  border-bottom: 1px solid var(--gray-700);
  position: sticky;
  top: 0;
  z-index: 50;
}

/* 导航项目 */
.nav-item {
  padding: 0.75rem 1rem;
  border-radius: var(--rounded-md);
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: var(--gray-700);
  transform: translateY(-1px);
}
```

#### 3.1.2 侧边导航优化（解决课程中心拥挤问题）
```css
/* 折叠式侧边栏 */
.sidebar {
  width: 280px;
  background: var(--dark-bg-tertiary);
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 64px;
}

/* 导航分组 */
.nav-group {
  margin-bottom: 1.5rem;
}

.nav-group-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gray-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  padding: 0 1rem;
}

/* 二级导航项 */
.nav-sub-item {
  padding: 0.5rem 1rem 0.5rem 2rem;
  font-size: var(--text-sm);
  border-left: 2px solid transparent;
}

.nav-sub-item.active {
  border-left-color: var(--primary-500);
  background: var(--primary-500/10);
  color: var(--primary-400);
}
```

#### 3.1.3 面包屑导航
```css
.breadcrumb {
  display: flex;
  align-items: center;
  font-size: var(--text-sm);
  color: var(--gray-500);
  margin-bottom: 1.5rem;
}

.breadcrumb-item:not(:last-child)::after {
  content: "/";
  margin: 0 0.5rem;
  color: var(--gray-400);
}
```

### 3.2 交互反馈

#### 3.2.1 按钮状态设计
```css
/* 主要按钮 */
.btn-primary {
  background: var(--primary-500);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: var(--rounded-lg);
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  background: var(--gray-400);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 游戏化按钮 */
.btn-game {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  border-radius: var(--rounded-xl);
  padding: 1rem 2rem;
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  position: relative;
  overflow: hidden;
}

.btn-game::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.btn-game:hover::before {
  left: 100%;
}
```

#### 3.2.2 表单交互设计
```css
/* 输入框 */
.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--gray-600);
  border-radius: var(--rounded-lg);
  background: var(--dark-bg-secondary);
  color: var(--gray-100);
  font-size: var(--text-base);
  transition: border-color 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-500/20);
}

.input-field.error {
  border-color: var(--error-500);
}

/* 下拉选择器 */
.select-field {
  position: relative;
  cursor: pointer;
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--dark-bg-secondary);
  border: 1px solid var(--gray-600);
  border-radius: var(--rounded-lg);
  box-shadow: var(--shadow-lg);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}
```

#### 3.2.3 加载状态设计
```css
/* 骨架屏 */
.skeleton {
  background: linear-gradient(90deg, var(--gray-700) 25%, var(--gray-600) 50%, var(--gray-700) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 加载spinner */
.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--gray-600);
  border-top: 2px solid var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### 3.3 动效规范

#### 3.3.1 页面切换动画
```css
/* 页面淡入淡出 */
.page-transition-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-transition-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-transition-exit {
  opacity: 1;
  transform: translateY(0);
}

.page-transition-exit-active {
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
```

#### 3.3.2 卡片动画
```css
/* 卡片悬浮效果 */
.card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-hover:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-hover);
}

/* 卡片翻转动画 */
.card-flip {
  perspective: 1000px;
}

.card-flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.card-flip:hover .card-flip-inner {
  transform: rotateY(180deg);
}
```

#### 3.3.3 微交互动画
```css
/* 点击波纹效果 */
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.ripple:active::after {
  width: 300px;
  height: 300px;
}
```

## 4. 组件设计规范

### 4.1 基础组件

#### 4.1.1 卡片组件
```css
/* 基础卡片 */
.card {
  background: var(--dark-bg-secondary);
  border-radius: var(--rounded-xl);
  padding: var(--padding-lg);
  border: 1px solid var(--gray-700);
  box-shadow: var(--shadow-md);
}

/* 学习模块卡片 */
.learning-card {
  position: relative;
  background: linear-gradient(135deg, var(--dark-bg-secondary), var(--dark-bg-tertiary));
  border-radius: var(--rounded-2xl);
  padding: 2rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.learning-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--primary-500);
}

.learning-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

/* 统计卡片 */
.stats-card {
  text-align: center;
  background: var(--dark-bg-secondary);
  border-radius: var(--rounded-xl);
  padding: 1.5rem;
  border: 1px solid var(--gray-700);
}

.stats-number {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--primary-400);
  margin-bottom: 0.5rem;
}

.stats-label {
  font-size: var(--text-sm);
  color: var(--gray-400);
}
```

#### 4.1.2 按钮组件
```css
/* 按钮尺寸变量 */
.btn-sm { padding: 0.5rem 1rem; font-size: var(--text-sm); }
.btn-md { padding: 0.75rem 1.5rem; font-size: var(--text-base); }
.btn-lg { padding: 1rem 2rem; font-size: var(--text-lg); }

/* 按钮变体 */
.btn-secondary {
  background: var(--gray-600);
  color: var(--gray-100);
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--primary-500);
  color: var(--primary-400);
}

.btn-ghost {
  background: transparent;
  color: var(--gray-300);
}

.btn-ghost:hover {
  background: var(--gray-700);
}
```

#### 4.1.3 输入组件
```css
/* 搜索框 */
.search-input {
  position: relative;
}

.search-input input {
  padding-left: 2.5rem;
}

.search-input .search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
}

/* 标签输入 */
.tag-input {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 2px solid var(--gray-600);
  border-radius: var(--rounded-lg);
  background: var(--dark-bg-secondary);
}

.tag {
  background: var(--primary-500);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: var(--rounded-md);
  font-size: var(--text-sm);
}
```

### 4.2 游戏化组件

#### 4.2.1 进度条组件
```css
/* 学习进度条 */
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--gray-700);
  border-radius: var(--rounded-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-400));
  border-radius: var(--rounded-full);
  transition: width 0.5s ease;
  position: relative;
}

.progress-fill::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: progress-shine 2s infinite;
}

@keyframes progress-shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* 圆形进度环 */
.progress-circle {
  position: relative;
  width: 120px;
  height: 120px;
}

.progress-circle svg {
  transform: rotate(-90deg);
}

.progress-circle-bg {
  fill: none;
  stroke: var(--gray-700);
  stroke-width: 8;
}

.progress-circle-fill {
  fill: none;
  stroke: var(--primary-500);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}
```

#### 4.2.2 成就徽章组件
```css
/* 徽章基础样式 */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--rounded-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.badge-bronze {
  background: linear-gradient(135deg, #cd7f32, #b8860b);
  color: white;
}

.badge-silver {
  background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
  color: white;
}

.badge-gold {
  background: linear-gradient(135deg, #ffd700, #ffb347);
  color: #8b4513;
}

/* 动态徽章效果 */
.badge-animated {
  animation: badge-glow 2s ease-in-out infinite alternate;
}

@keyframes badge-glow {
  from { box-shadow: 0 0 5px currentColor; }
  to { box-shadow: 0 0 15px currentColor; }
}
```

#### 4.2.3 计分器组件
```css
/* 分数显示 */
.score-display {
  text-align: center;
  font-family: var(--font-numeric);
}

.score-number {
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  background: linear-gradient(135deg, var(--primary-400), var(--primary-600));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.score-label {
  font-size: var(--text-sm);
  color: var(--gray-400);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 0.5rem;
}

/* 分数变化动画 */
.score-change {
  position: relative;
}

.score-change.increasing::after {
  content: "+";
  position: absolute;
  top: -20px;
  right: 0;
  color: var(--success-500);
  font-weight: var(--font-bold);
  animation: score-up 0.5s ease-out;
}

@keyframes score-up {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}
```

## 5. 页面设计详细说明

| 页面名称 | 页面目标 | 布局结构 | 关键元素 | 交互逻辑 | 状态变化 |
|:--------:|:--------:|:--------:|:--------:|:--------:|:--------:|
| 首页 | 展示核心学习模块，快速进入学习状态 | 顶部导航+英雄区+三大模块卡片+统计面板+底部链接 | Logo、学习进度条、模块入口卡片、今日统计 | 卡片悬浮效果、点击进入对应模块、进度条动画 | 登录/未登录状态、进度数据实时更新 |
| 词汇训练 | 通过游戏化方式提升词汇记忆效果 | 游戏区域+进度显示+分数统计+操作按钮 | 词汇卡片、选项按钮、计时器、分数显示 | 卡片翻转、按钮点击反馈、答对错动画 | 答题中/结算/暂停状态切换 |
| 语法练习 | 通过拖拽构句掌握语法规则 | 题目区+词汇池+构句区+提示面板 | 拖拽词汇块、句子构建区、语法提示 | 拖拽排序、自动吸附、错误提示 | 构句中/验证中/完成状态 |
| 口语练习 | 中英对照练习提升口语表达 | 对话场景+录音区+评分显示+标准音频 | 中文提示、录音按钮、音波显示、评分结果 | 录音开始/停止、音频播放、重试机制 | 准备/录音中/分析中/结果展示 |
| 课程中心 | 系统化学习课程，优化导航体验 | 侧边导航+面包屑+课程网格+筛选器 | 折叠式导航、课程卡片、进度指示器 | 导航折叠展开、筛选切换、课程预览 | 导航展开/收缩、加载中/加载完成 |
| 个人中心 | 查看学习数据和个人设置 | 用户信息+统计图表+设置面板+排行榜 | 头像、学习曲线图、主题切换器、成就展示 | 主题切换、数据筛选、设置保存 | 数据加载、主题切换中、保存成功 |

## 6. 主题系统设计

### 6.1 深色主题（默认）
```css
:root {
  /* 背景色 */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  
  /* 文字色 */
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  
  /* 边框色 */
  --border-primary: #475569;
  --border-secondary: #64748b;
}
```

### 6.2 浅色主题
```css
[data-theme="light"] {
  /* 背景色 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  
  /* 文字色 */
  --text-primary: #1e293b;
  --text-secondary: #475569;
  --text-tertiary: #64748b;
  
  /* 边框色 */
  --border-primary: #e2e8f0;
  --border-secondary: #cbd5e1;
}
```

### 6.3 主题切换实现
```css
/* 主题切换器 */
.theme-toggle {
  position: relative;
  width: 60px;
  height: 30px;
  background: var(--gray-600);
  border-radius: var(--rounded-full);
  cursor: pointer;
  transition: background 0.3s ease;
}

.theme-toggle.light {
  background: var(--primary-500);
}

.theme-toggle-handle {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle.light .theme-toggle-handle {
  transform: translateX(30px);
}

/* 平滑过渡 */
* {
  transition-property: background-color, border-color, color, box-shadow;
  transition-duration: 0.2s;
  transition-timing-function: ease-in-out;
}
```

## 7. 响应式设计

### 7.1 断点设置
```css
/* 媒体查询断点 */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### 7.2 移动端适配
```css
/* 移动端首页布局 */
@media (max-width: 768px) {
  .homepage-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
  
  .learning-card {
    padding: 1.5rem;
  }
  
  .nav-desktop {
    display: none;
  }
  
  .nav-mobile {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--dark-bg-secondary);
    border-top: 1px solid var(--gray-700);
    padding: 0.75rem;
    justify-content: space-around;
  }
}

/* 平板端布局 */
@media (min-width: 768px) and (max-width: 1024px) {
  .homepage-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  
  .sidebar {
    width: 240px;
  }
}
```

### 7.3 游戏界面适配
```css
/* 词汇训练移动端 */
@media (max-width: 768px) {
  .word-blitz-card {
    max-width: 90vw;
    height: 50vh;
    font-size: var(--text-xl);
  }
  
  .answer-buttons {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .game-controls {
    flex-direction: column;
    gap: 1rem;
  }
}

/* 语法练习拖拽区域 */
@media (max-width: 768px) {
  .sentence-builder {
    flex-direction: column;
    gap: 1rem;
  }
  
  .word-pool {
    max-height: 150px;
    overflow-y: auto;
  }
  
  .drop-zone {
    min-height: 80px;
    padding: 1rem;
  }
}
```

## 8. 游戏化设计元素

### 8.1 视觉反馈系统
```css
/* 正确答案反馈 */
.feedback-correct {
  background: linear-gradient(135deg, var(--success-500), var(--success-600));
  color: white;
  padding: 1rem;
  border-radius: var(--rounded-lg);
  text-align: center;
  animation: success-bounce 0.6s ease;
}

@keyframes success-bounce {
  0%, 20%, 60%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  80% { transform: translateY(-5px); }
}

/* 错误答案反馈 */
.feedback-error {
  background: linear-gradient(135deg, var(--error-500), var(--error-600));
  color: white;
  padding: 1rem;
  border-radius: var(--rounded-lg);
  text-align: center;
  animation: error-shake 0.6s ease;
}

@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}
```

### 8.2 连击系统
```css
/* 连击显示 */
.combo-display {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  pointer-events: none;
}

.combo-number {
  font-size: var(--text-6xl);
  font-weight: var(--font-extrabold);
  background: linear-gradient(135deg, #ff6b35, #ff8e53);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: combo-pop 0.8s ease;
}

@keyframes combo-pop {
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(0deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.combo-text {
  text-align: center;
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--warning-400);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

### 8.3 粒子效果
```css
/* 成功粒子效果 */
.particle-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--primary-400);
  border-radius: 50%;
  animation: particle-float 2s ease-out forwards;
}

@keyframes particle-float {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(0);
  }
}
```

## 9. 性能优化设计

### 9.1 图像优化
```css
/* 图片懒加载占位 */
.image-placeholder {
  background: linear-gradient(90deg, var(--gray-700), var(--gray-600), var(--gray-700));
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--rounded-lg);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 渐进式图片加载 */
.progressive-image {
  position: relative;
  overflow: hidden;
}

.progressive-image-placeholder {
  filter: blur(5px);
  transform: scale(1.1);
  transition: opacity 0.3s ease;
}

.progressive-image-full {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.progressive-image-loaded .progressive-image-full {
  opacity: 1;
}
```

### 9.2 动画性能优化
```css
/* 使用transform和opacity进行动画 */
.optimized-animation {
  will-change: transform, opacity;
  transform: translateZ(0); /* 启用硬件加速 */
}

/* 减少重绘的悬浮效果 */
.performance-hover {
  transform: translateZ(0);
  transition: transform 0.2s ease;
}

.performance-hover:hover {
  transform: translateZ(0) translateY(-2px);
}

/* 延迟动画启动 */
.delayed-animation {
  animation-play-state: paused;
}

.delayed-animation.in-view {
  animation-play-state: running;
}
```

## 10. 可访问性设计

### 10.1 颜色对比度
```css
/* 确保足够的颜色对比度 */
.high-contrast {
  --text-contrast-ratio: 7:1; /* WCAG AAA 标准 */
}

/* 色盲友好的状态色 */
.colorblind-friendly-success {
  background: var(--success-500);
  position: relative;
}

.colorblind-friendly-success::after {
  content: "✓";
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  font-weight: bold;
}
```

### 10.2 键盘导航
```css
/* 焦点指示器 */
.focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  border-radius: var(--rounded-md);
}

/* 跳转到主内容链接 */
.skip-to-content {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-500);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: var(--rounded-md);
  z-index: 1000;
}

.skip-to-content:focus {
  top: 6px;
}
```

### 10.3 屏幕阅读器支持
```css
/* 视觉隐藏但屏幕阅读器可读 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 为屏幕阅读器提供上下文 */
.sr-context::before {
  content: attr(aria-label) ": ";
  clip: rect(1px, 1px, 1px, 1px);
  position: absolute;
}
```

## 11. 开发实现指南

### 11.1 组件开发规范
```typescript
// 组件结构示例
interface ComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

// 使用CSS变量的组件样式
const styles = {
  base: `
    font-family: var(--font-english);
    border-radius: var(--rounded-lg);
    transition: all 0.2s ease;
    focus:outline-none focus:ring-2 focus:ring-primary-500
  `,
  variants: {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-gray-600 text-gray-100 hover:bg-gray-500',
    ghost: 'bg-transparent text-gray-300 hover:bg-gray-700'
  },
  sizes: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base', 
    lg: 'px-6 py-3 text-lg'
  }
};
```

### 11.2 状态管理规范
```typescript
// 主题状态管理
interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// 学习进度状态
interface LearningState {
  currentScore: number;
  totalQuestions: number;
  streakCount: number;
  updateScore: (points: number) => void;
  resetProgress: () => void;
}
```

### 11.3 动画实现指南
```typescript
// 使用Framer Motion实现动画
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  hover: {
    y: -8,
    transition: { duration: 0.2 }
  }
};

// 页面切换动画
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 }
};
```

### 11.4 性能优化建议
1. **代码分割**：使用 `React.lazy()` 和 `Suspense` 进行路由级别的代码分割
2. **图片优化**：使用 Next.js `Image` 组件，支持 WebP 格式
3. **字体优化**：使用 `font-display: swap` 避免文字闪烁
4. **CSS优化**：使用 CSS-in-JS 或 CSS Modules 避免样式冲突
5. **状态优化**：合理使用 `useMemo` 和 `useCallback` 避免不必要的重渲染

### 11.5 测试要求
```typescript
// 组件测试示例
describe('LearningCard', () => {
  it('should render with correct content', () => {
    render(<LearningCard title="Word Blitz" description="词汇训练" />);
    expect(screen.getByText('Word Blitz')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<LearningCard onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be accessible', async () => {
    const { container } = render(<LearningCard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 11.6 部署注意事项
1. **环境变量**：确保所有必要的环境变量已配置
2. **构建优化**：启用 gzip 压缩和资源缓存
3. **错误监控**：集成 Sentry 或类似工具进行错误追踪
4. **性能监控**：使用 Web Vitals 监控核心性能指标
5. **SEO优化**：配置正确的 meta 标签和结构化数据

---

**文档版本**：v1.0  
**创建日期**：2024-08-16  
**最后更新**：2024-08-16  
**负责人**：UI/UX设计团队

此设计规范文档为游戏化英语学习平台提供了完整的设计指导，确保产品在视觉、交互、性能等方面达到最佳用户体验。开发团队应严格按照此规范进行实现，并在开发过程中及时反馈问题，持续优化设计方案。