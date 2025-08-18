# 英语学习平台 - English Learning SM2

一个基于Next.js 14的现代英语学习应用，采用YouTube式布局设计，集成SM2间隔重复算法，提供科学高效的学习体验。

## ✨ 产品特色

### 🎯 核心学习模块
- **词汇量训练 (Word Blitz)** - 快速单词记忆游戏，图文联想学习
- **语法掌握 (Sentence Builder)** - 拖拽式句子构建，训练语法应用
- **口语练习 (Chinese-English)** - 中英对照练习，提升表达能力  
- **键盘练习 (Keyboard Practice)** - 英语打字训练，提升输入效率

### 🚀 技术亮点
- **深色科技风设计** - 参考OpenAI和YouTube的现代化UI
- **响应式布局** - 完美适配桌面端和移动端
- **流畅动画效果** - 基于Framer Motion的精美交互
- **本地数据存储** - 无需注册，保护用户隐私
- **SM-2算法** - 科学的间隔重复学习系统

## 🛠️ 技术栈

### 前端技术
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + CSS Variables
- **动画**: Framer Motion
- **图标**: Lucide React
- **状态管理**: Zustand
- **UI组件**: 自研组件库

### 开发工具
- **数据库**: Prisma + SQLite
- **拖拽功能**: @dnd-kit
- **通知提示**: React Hot Toast
- **代码规范**: ESLint + TypeScript

## 📦 安装和运行

### 环境要求
- Node.js 18.0.0 或更高版本
- npm 或 yarn 包管理器

### 快速开始

1. **克隆项目**
```bash
git clone https://github.com/your-repo/next-english-app-sm2.git
cd next-english-app-sm2
```

2. **安装依赖**
```bash
npm install
```

3. **初始化数据库**
```bash
npx prisma generate
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 构建和部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## 📁 项目结构

```
next-english-app-sm2/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 首页 - 产品介绍
│   ├── learn/             # 学习中心
│   │   └── page.tsx       # 学习平台主页
│   ├── play/              # 游戏模块
│   │   ├── word-blitz/    # 词汇量训练
│   │   ├── chinese-english/# 口语练习
│   │   └── keyboard-practice/# 键盘练习
│   ├── leaderboard/       # 排行榜
│   └── globals.css        # 全局样式
├── components/            # 组件库
│   ├── ui/               # 基础UI组件
│   │   ├── Button.tsx    # 按钮组件
│   │   ├── Card.tsx      # 卡片组件
│   │   ├── Navigation.tsx# 导航组件
│   │   ├── Progress.tsx  # 进度条组件
│   │   └── index.ts      # 组件导出
│   └── [其他组件]/
├── hooks/                # 自定义Hooks
├── store/               # 状态管理
├── types/               # TypeScript类型定义
├── prisma/              # 数据库配置
└── public/              # 静态资源
```

## 🎨 设计系统

### 色彩规范
```css
/* 深色主题 */
--primary-dark: #0d1117;      /* 主背景色 */
--secondary-dark: #161b22;    /* 次要背景色 */
--card-dark: #21262d;         /* 卡片背景色 */

/* 文本色彩 */
--text-primary: #f0f6fc;      /* 主要文本 */
--text-secondary: #8b949e;    /* 次要文本 */
--text-muted: #6e7681;        /* 辅助文本 */

/* 渐变色系 */
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-success: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
```

### 组件规范
- **按钮**: 支持primary、secondary、ghost等变体
- **卡片**: 统一的阴影和圆角系统
- **导航**: 响应式设计，支持移动端汉堡菜单
- **进度条**: 带动画效果的进度指示器

## 🎮 功能说明

### 词汇量训练 (Word Blitz)
- 快速单词记忆游戏
- 图片辅助记忆
- 多选题形式
- 实时计分和连击系统
- 语音播放功能

### 语法掌握 (Sentence Builder)  
- 拖拽式句子构建
- 语法规则验证
- 渐进式难度
- 即时反馈机制

### 口语练习 (Chinese-English)
- 中英文对照练习
- 语音识别评分
- 发音纠正建议
- 口语流利度训练

### 键盘练习 (Keyboard Practice)
- 英语打字速度训练
- WPM (每分钟词数) 统计
- 准确率实时监控
- 错误字符高亮显示

## 📊 数据管理

### 本地存储
- 学习进度自动保存
- 用户设置持久化
- 离线数据同步
- 隐私保护设计

### 数据结构
```typescript
interface LearningStats {
  totalSessions: number;      // 总学习次数
  averageAccuracy: number;    // 平均准确率
  totalWordsLearned: number;  // 掌握词汇数
  streakDays: number;         // 连续学习天数
}
```

## 🤝 贡献指南

### 开发流程
1. Fork项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

### 代码规范
- 使用TypeScript编写
- 遵循ESLint规则
- 添加必要的注释
- 确保响应式设计

## 📄 许可证

本项目采用 [MIT许可证](LICENSE) - 查看LICENSE文件了解详情

## 🎯 快速体验

1. 访问应用首页
2. 无需注册，直接开始学习
3. 选择学习模块，体验游戏化学习
4. 查看学习进度和成绩统计

**立即开始您的英语学习之旅！** 🚀
