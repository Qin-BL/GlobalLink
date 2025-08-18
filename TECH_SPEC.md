# 技术规范文档 (TECH_SPEC.md)

## 项目概述
基于Next.js的英语学习应用YouTube式布局重构项目，保持所有现有功能并增强用户体验。

## 技术栈
- **框架**: Next.js 14.2.5 + TypeScript 5.4.5
- **样式**: Tailwind CSS 3.4.7 + 自定义CSS变量系统
- **状态管理**: Zustand 4.5.2
- **数据库**: Prisma 5.17.0 + SQLite
- **动画**: Framer Motion 11.3.19
- **拖拽**: @dnd-kit/core 6.1.0
- **图标**: Lucide React 0.427.0
- **通知**: React Hot Toast 2.4.1

## 设计系统
### 布局规范
- **侧边导航栏**: 280px宽(展开) / 64px宽(折叠)
- **顶部导航栏**: 64px高，毛玻璃效果
- **主内容区**: 动态宽度，卡片式布局
- **课程卡片**: 320x240px标准尺寸

### 色彩系统（深色科技风）
- **主背景**: #0d1117 (--primary-dark)
- **次要背景**: #161b22 (--secondary-dark)
- **卡片背景**: #21262d (--card-dark)
- **边框颜色**: #30363d (--border-color)
- **悬停背景**: #262c36 (--hover-bg)

### 渐变色系
- **主渐变**: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- **次要渐变**: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
- **成功渐变**: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)
- **警告渐变**: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)

## 核心功能模块

### 1. YouTube式布局系统 (P0 - 优先级最高)
#### 1.1 侧边导航栏组件
```typescript
interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

// 功能：
- 280px宽度展开状态，显示完整导航菜单
- 64px宽度折叠状态，仅显示图标
- 平滑动画过渡效果
- 响应式设计，移动端自动隐藏
- 导航分组：学习功能、游戏模式、个人中心、系统设置
```

#### 1.2 顶部导航栏组件
```typescript
interface TopNavProps {
  user?: User;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

// 功能：
- 64px固定高度
- 毛玻璃效果 (backdrop-filter: blur(10px))
- 搜索框、用户头像、设置按钮
- 移动端汉堡菜单
- 面包屑导航显示
```

#### 1.3 主内容区布局
```typescript
interface MainContentProps {
  sidebarCollapsed: boolean;
  children: React.ReactNode;
}

// 功能：
- 动态边距适配侧边栏状态
- 卡片式内容容器
- 响应式网格布局
- 滚动优化和虚拟化
```

### 2. 课程中心功能 (P1)
#### 2.1 难度分级系统
```typescript
interface DifficultyLevel {
  id: string;
  name: string;          // 初级/中级/高级
  cefrLevels?: string[]; // ['A1', 'A2'] for 高级模式
  color: string;
  gradient: string;
}

// 三级难度分类：
- 初级：基础单词、简单句型
- 中级：复杂语法、对话练习
- 高级：CEFR标准A1-C2六个等级
```

#### 2.2 课程卡片组件
```typescript
interface CourseCardProps {
  course: Course;
  difficulty: DifficultyLevel;
  progress?: number;
  onClick: () => void;
}

// 标准尺寸：320x240px
// 包含：课程封面、标题、难度标签、进度条、开始按钮
```

#### 2.3 搜索筛选系统
```typescript
interface SearchFilters {
  query: string;
  difficulty: string[];
  category: string[];
  completed: boolean;
  sortBy: 'recent' | 'difficulty' | 'progress';
}
```

### 3. 学习功能优化 (P1)
#### 3.1 口语学习增强
```typescript
interface SpeakingExercise {
  id: string;
  sentence: string;
  audioUrl: string;
  options: string[];
  correctOrder: number[];
}

// 功能增强：
- 拖拽排序 + 点击选择双重交互
- 录音对比功能 (Web Speech API)
- 发音评分系统 (0-100分)
- 实时语音波形显示
- 重复练习建议
```

#### 3.2 连词造句集成
```typescript
interface SentenceBuilder {
  words: Word[];
  targetSentence: string;
  difficulty: number;
  hints: string[];
}

// earthworm模式特性：
- 单词拖拽组句
- 语法错误提示
- 多种正确答案支持
- 循序渐进难度
```

### 4. Git课程上传系统 (P2)
#### 4.1 课程文件格式
```json
{
  "course": {
    "id": "course-001",
    "title": "基础英语对话",
    "description": "适合初学者的日常对话课程",
    "difficulty": "beginner",
    "cefrLevel": "A1",
    "category": "conversation",
    "author": "教师姓名",
    "version": "1.0.0",
    "lessons": [
      {
        "id": "lesson-001",
        "title": "问候与介绍",
        "type": "speaking",
        "content": {
          "dialogue": "Hello, my name is...",
          "vocabulary": ["hello", "name", "nice"],
          "exercises": []
        }
      }
    ]
  }
}
```

#### 4.2 上传审核流程
```typescript
interface CourseSubmission {
  file: File;
  metadata: CourseMetadata;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  reviewer?: string;
  submittedAt: Date;
}
```

## 技术架构

### 1. 文件结构
```
app/
├── (dashboard)/            # YouTube式布局路由组
│   ├── layout.tsx         # 主布局：侧边栏+顶栏
│   ├── page.tsx          # 首页仪表板
│   ├── courses/          # 课程中心
│   ├── learning/         # 学习模块
│   └── games/            # 游戏模式
├── components/
│   ├── layout/           # 布局组件
│   │   ├── Sidebar.tsx
│   │   ├── TopNav.tsx
│   │   └── MainContent.tsx
│   ├── course/           # 课程相关组件
│   ├── game/             # 游戏组件
│   └── ui/              # 通用UI组件
├── store/
│   ├── layout.ts        # 布局状态管理
│   ├── course.ts        # 课程状态管理
│   └── user.ts          # 用户状态管理
├── hooks/
│   ├── useLayout.ts     # 布局相关hooks
│   ├── useCourse.ts     # 课程相关hooks
│   └── useAuth.ts       # 认证相关hooks
└── types/
    ├── layout.ts        # 布局类型定义
    ├── course.ts        # 课程类型定义
    └── game.ts          # 游戏类型定义
```

### 2. 状态管理架构
```typescript
// store/layout.ts
interface LayoutStore {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  toggleSidebar: () => void;
  closeMobileMenu: () => void;
}

// store/course.ts
interface CourseStore {
  courses: Course[];
  currentCourse: Course | null;
  searchQuery: string;
  filters: SearchFilters;
  setSearchQuery: (query: string) => void;
  applyFilters: (filters: SearchFilters) => void;
}
```

### 3. 性能优化策略
#### 3.1 代码分割
- 路由级别代码分割 (Dynamic imports)
- 组件懒加载 (React.lazy)
- 课程内容按需加载

#### 3.2 渲染优化
- React.memo 包装纯组件
- useMemo/useCallback 优化计算
- 虚拟列表处理大量课程数据

#### 3.3 资源优化
- 图片懒加载和WebP格式
- 音频文件压缩和流式加载
- CDN资源缓存策略

### 4. 动画系统
```typescript
// 使用Framer Motion的动画配置
const layoutTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { y: -5, scale: 1.02 }
};
```

## 开发计划

### Phase 1: YouTube式布局 (1-2天)
1. ✅ 创建布局组件架构
2. ✅ 实现侧边导航栏
3. ✅ 实现顶部导航栏
4. ✅ 主内容区域适配
5. ✅ 响应式设计完善

### Phase 2: 课程中心 (2-3天)
1. 难度分级系统
2. 课程卡片组件
3. 搜索筛选功能
4. 课程详情页面
5. 进度跟踪集成

### Phase 3: 学习功能优化 (2-3天)
1. 口语学习增强
2. 录音对比功能
3. 发音评分系统
4. 连词造句优化
5. 交互动画完善

### Phase 4: Git课程系统 (1-2天)
1. 文件上传组件
2. JSON格式验证
3. 课程审核界面
4. 版本控制功能

## 兼容性要求
- 保持所有现有API兼容
- 现有用户数据无缝迁移
- 现有学习进度保留
- 现有积分排行榜功能

## 测试策略
- 单元测试：核心组件和功能
- 集成测试：路由和状态管理
- 端到端测试：关键用户流程
- 性能测试：页面加载和动画流畅度

## 部署配置
- 开发环境：next dev (端口3000)
- 构建优化：next build + start
- 数据库迁移：prisma migrate
- 静态资源：CDN部署优化