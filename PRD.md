# 产品需求文档 (PRD) - 英语学习网站完善项目

## 1. 项目概述

### 1.1 项目背景
- **现有基础**: Next.js 英语学习应用，包含单词闪卡 (word-blitz)、连词造句功能和 SM-2 间隔重复算法
- **技术栈**: Next.js 14、Prisma ORM、SQLite、Tailwind CSS、Web Speech API
- **用户群体**: 中文母语背景的英语学习者
- **市场机会**: 融合 Earthworm 语言学习方法论，打造个性化英语学习平台

### 1.2 产品定位
面向中文母语者的智能英语学习平台，通过科学的间隔重复算法和沉浸式学习体验，帮助用户系统提升英语综合能力。

### 1.3 核心价值主张
- **科学学习**: 基于 SM-2 算法的个性化复习计划
- **沉浸体验**: 汉英对照的渐进式语言习得
- **智能适应**: 根据用户表现动态调整学习难度
- **全面技能**: 涵盖听说读写四大语言技能

## 2. 用户研究

### 2.1 目标用户画像

#### 主要用户群体
- **年龄段**: 16-35岁
- **教育背景**: 高中及以上学历
- **英语水平**: 初级到中高级 (HSK 1-6 对应)
- **学习动机**: 提升职场竞争力、出国留学准备、个人兴趣

#### 用户特征分析
- **时间碎片化**: 利用通勤、休息时间学习
- **目标导向**: 希望看到明确的学习进度和效果
- **多元化需求**: 需要听说读写全方位训练
- **社交互动**: 喜欢通过排行榜、挑战等方式与他人互动

### 2.2 用户需求分析

#### 核心需求
1. **系统性学习**: 完整的学习路径规划
2. **个性化适应**: 根据个人水平调整内容难度
3. **即时反馈**: 学习过程中的实时纠错和指导
4. **进度可视**: 清晰的学习成果展示

#### 痛点分析
- **传统方法枯燥**: 机械背诵单词效果不佳
- **缺乏系统性**: 零散的学习内容难以形成知识体系
- **反馈滞后**: 无法及时发现和纠正学习错误
- **动机不足**: 缺乏持续学习的激励机制

### 2.3 用户使用场景

#### 场景1: 日常通勤学习
- **时间**: 20-30分钟
- **环境**: 地铁、公交车上
- **需求**: 轻量级学习模块，支持离线使用
- **功能**: 单词复习、句子构建练习

#### 场景2: 专注学习时段
- **时间**: 45-60分钟
- **环境**: 家中或图书馆
- **需求**: 深度学习内容，系统性训练
- **功能**: 语法模式训练、听力练习、日常挑战

#### 场景3: 移动设备学习
- **时间**: 10-15分钟
- **环境**: 随时随地
- **需求**: 快速复习，保持学习连续性
- **功能**: 快速复习模式、进度查看

## 3. 产品目标

### 3.1 业务目标
- **用户增长**: 3个月内达到 500+ 日活用户
- **用户粘性**: 日留存率 >70%，周留存率 >40%，月留存率 >20%
- **学习效果**: 用户30天内平均准确率提升15%
- **用户满意度**: 平均评分 >4.2/5.0

### 3.2 用户体验目标
- **学习效率**: 平均每session完成20+句子练习
- **系统性能**: 初始加载时间 <3秒，页面响应 <500ms
- **移动体验**: Lighthouse移动端评分 >90
- **易用性**: 新用户3分钟内完成首次学习流程

### 3.3 技术目标
- **系统稳定性**: 99.5%以上系统可用性
- **错误率控制**: <0.1%系统错误率
- **数据安全**: 用户学习数据完整性保障
- **扩展性**: 支持未来多语种扩展

## 4. 功能需求

### 4.1 个性化学习路径规划模块

#### 4.1.1 功能描述
基于用户当前英语水平和学习目标，智能生成个性化的学习路径和内容推荐。

#### 4.1.2 核心功能
- **水平评估**: 初始化英语能力测试
- **学习计划**: 基于SM-2算法的复习计划
- **内容推荐**: 根据用户薄弱环节推荐练习内容
- **进度追踪**: 实时记录学习进度和成效

#### 4.1.3 技术实现方案
```typescript
// 学习路径规划引擎
class LearningPathEngine {
  generatePath(userLevel: number, goals: LearningGoal[]): LearningPath
  updatePath(userId: string, performance: PerformanceData): void
  getNextContent(userId: string): Promise<LearningContent>
}

// SM-2 算法实现
class SM2Algorithm {
  calculateNextInterval(current: Progress, quality: number): Progress
  updateEaseFactor(current: number, quality: number): number
  getDueItems(userId: string): Promise<ContentItem[]>
}
```

#### 4.1.4 验收标准
- [ ] 新用户能在3分钟内完成水平评估
- [ ] 学习计划准确反映用户当前水平
- [ ] SM-2算法正确计算复习间隔
- [ ] 个性化推荐内容相关性 >80%

### 4.2 汉英对照学习模块

#### 4.2.1 功能描述
核心学习模式，用户看到中文句子，通过拖拽排列英文单词标记构建正确的英文翻译。

#### 4.2.2 核心功能
- **句子展示**: 中文句子呈现
- **标记拖拽**: 英文单词标记的拖拽排列
- **实时验证**: 句子构建过程中的即时反馈
- **渐进提示**: 多层次提示系统
- **音频支持**: 中英文语音播放

#### 4.2.3 技术实现方案
```typescript
// 中英对照游戏引擎
class ChineseEnglishGame {
  async getNextSentence(userId: string, difficulty?: number): Promise<GameSentence>
  validateConstruction(userInput: string[], correctAnswer: string[]): ValidationResult
  generateHints(sentence: GameSentence, level: number): string[]
  calculateScore(attempt: AttemptData): ScoreResult
}

// 拖拽交互组件
interface DragDropToken {
  id: string
  text: string
  isPlaced: boolean
  position: number
}
```

#### 4.2.4 验收标准
- [ ] 拖拽操作流畅，支持桌面和移动端
- [ ] 实时验证准确率 >95%
- [ ] 提示系统层次清晰，不破坏学习效果
- [ ] 音频播放成功率 >98%

### 4.3 听力/口语训练模块

#### 4.3.1 功能描述
通过语音识别技术，提供听力理解和口语练习功能，提升用户的听说能力。

#### 4.3.2 核心功能
- **听力练习**: 播放英文音频，用户选择对应中文意思
- **跟读练习**: 用户跟读英文句子，系统评估发音准确性
- **对话模拟**: 模拟实际对话场景的互动练习
- **发音纠正**: 基于语音识别的发音指导

#### 4.3.3 技术实现方案
```typescript
// 音频管理系统
class AudioManager {
  playAudio(text: string, language: 'zh' | 'en'): Promise<void>
  recordUserSpeech(): Promise<string>
  comparePronounciation(user: string, target: string): PronunciationScore
  preloadAudioContent(contentIds: string[]): Promise<void>
}

// 语音识别评估
interface PronunciationScore {
  overall: number
  phonemes: PhonemeScore[]
  feedback: string[]
}
```

#### 4.3.4 验收标准
- [ ] 语音识别准确率 >85%
- [ ] 音频播放延迟 <1秒
- [ ] 发音评估结果与专业评估相关性 >75%
- [ ] 支持主流浏览器的Web Speech API

### 4.4 学习数据分析与智能建议模块

#### 4.4.1 功能描述
收集用户学习行为数据，分析学习模式和效果，提供个性化的学习建议和改进方案。

#### 4.4.2 核心功能
- **学习分析**: 用户学习行为和效果分析
- **薄弱环节识别**: 基于错误模式识别学习薄弱点
- **学习建议**: 个性化的学习策略推荐
- **进度报告**: 定期学习成果报告

#### 4.4.3 技术实现方案
```typescript
// 学习分析引擎
class LearningAnalytics {
  analyzeUserProgress(userId: string): ProgressAnalysis
  identifyWeakAreas(userId: string): WeaknessReport
  generateRecommendations(analysis: ProgressAnalysis): Recommendation[]
  createProgressReport(userId: string, period: TimePeriod): LearningReport
}

// 数据模型
interface ProgressAnalysis {
  overallAccuracy: number
  strengthAreas: SkillArea[]
  weaknessAreas: SkillArea[]
  learningVelocity: number
  retentionRate: number
}
```

#### 4.4.4 验收标准
- [ ] 数据收集完整性 >95%
- [ ] 薄弱环节识别准确性 >80%
- [ ] 学习建议采纳后效果提升 >10%
- [ ] 报告生成时间 <3秒

### 4.5 实际应用场景练习模块

#### 4.5.1 功能描述
提供贴近真实生活的英语应用场景，包括日常对话、商务交流、学术写作等实用练习。

#### 4.5.2 核心功能
- **场景分类**: 日常生活、职场、学术、旅游等场景
- **情境对话**: 模拟真实对话环境的练习
- **实用表达**: 常用短语和表达方式训练
- **文化背景**: 英语文化背景知识介绍

#### 4.5.3 技术实现方案
```typescript
// 场景练习引擎
class ScenarioPractice {
  getScenarios(category: string): Scenario[]
  simulateConversation(scenarioId: string): ConversationFlow
  evaluateResponse(userResponse: string, context: Context): EvaluationResult
}

// 场景内容结构
interface Scenario {
  id: string
  category: string
  difficulty: number
  context: string
  dialogues: DialogueTurn[]
  culturalNotes: string[]
}
```

#### 4.5.4 验收标准
- [ ] 场景内容涵盖主要生活应用领域
- [ ] 对话流程自然，符合实际交流习惯
- [ ] 文化背景信息准确，有助于理解
- [ ] 用户完成率 >60%

## 5. 非功能需求

### 5.1 性能要求
- **响应时间**: 页面加载 <3秒，API响应 <200ms
- **并发处理**: 支持500+并发用户
- **数据处理**: 单次查询处理时间 <100ms
- **音频播放**: 音频加载和播放延迟 <1秒

### 5.2 安全性要求
- **数据隐私**: 用户学习数据加密存储
- **访问控制**: 基于用户身份的数据访问权限
- **数据备份**: 日常自动备份，数据恢复时间 <4小时
- **安全审计**: 定期安全漏洞扫描和修复

### 5.3 可用性要求
- **系统稳定性**: 99.5%系统可用性
- **错误处理**: 优雅的错误处理和用户提示
- **用户界面**: 直观易用，新用户学习成本 <10分钟
- **多设备支持**: 桌面、平板、手机全平台兼容

### 5.4 兼容性要求
- **浏览器支持**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **移动端**: iOS Safari 14+, Chrome Mobile 90+
- **Web API**: Web Speech API, Local Storage, Service Workers
- **PWA支持**: 支持离线使用和应用安装

## 6. 技术架构

### 6.1 技术栈
```
前端: Next.js 14 (App Router)
后端: Next.js API Routes
数据库: SQLite + Prisma ORM
样式: Tailwind CSS
语音: Web Speech API + TTS
状态管理: React Hooks + localStorage
部署: Vercel / 自托管
```

### 6.2 系统架构图
```
用户界面层 (Next.js App)
├── 学习模块 (Learning Modules)
├── 用户管理 (User Management)  
├── 进度追踪 (Progress Tracking)
└── 数据分析 (Analytics)

业务逻辑层 (API Routes)
├── 学习内容API (/api/content)
├── 用户进度API (/api/progress)
├── SM-2算法API (/api/spaced-repetition)
└── 分析统计API (/api/analytics)

数据访问层 (Prisma ORM)
├── 内容数据模型
├── 用户数据模型
├── 学习记录模型
└── 统计分析模型

数据存储层 (SQLite)
├── 学习内容表
├── 用户信息表
├── 学习记录表
└── 系统配置表
```

### 6.3 数据库设计要求

#### 核心数据表结构
```sql
-- 中英文句子内容表
CREATE TABLE chinese_sentences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chinese TEXT NOT NULL,
  english TEXT NOT NULL,
  difficulty INTEGER DEFAULT 1,
  grammar_pattern TEXT,
  topic_category TEXT,
  tokens TEXT, -- JSON: 英文单词标记
  hints TEXT,  -- JSON: 渐进式提示
  audio_chinese TEXT, -- 中文音频路径
  audio_english TEXT, -- 英文音频路径
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户学习记录表
CREATE TABLE user_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  sentence_id INTEGER NOT NULL,
  user_input TEXT NOT NULL, -- 用户构建的句子
  correct BOOLEAN NOT NULL,
  accuracy_score REAL, -- 准确率分数
  time_to_complete INTEGER, -- 完成时间(秒)
  hints_used INTEGER DEFAULT 0,
  mistakes TEXT, -- JSON: 错误详情
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sentence_id) REFERENCES chinese_sentences(id)
);

-- SM-2间隔重复进度表
CREATE TABLE learning_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  sentence_id INTEGER NOT NULL,
  repetitions INTEGER DEFAULT 0,
  interval_days INTEGER DEFAULT 0,
  ease_factor REAL DEFAULT 2.5,
  next_review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  mastery_level INTEGER DEFAULT 0, -- 0-5 掌握程度
  last_reviewed DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, sentence_id),
  FOREIGN KEY (sentence_id) REFERENCES chinese_sentences(id)
);
```

### 6.4 API设计要求

#### RESTful API端点设计
```typescript
// 学习内容API
GET    /api/content/next              // 获取下一个学习内容
POST   /api/content/attempt           // 提交学习尝试
GET    /api/content/progress/{userId} // 获取用户进度
POST   /api/content/hint              // 获取提示

// 用户管理API  
GET    /api/user/profile/{userId}     // 获取用户资料
PUT    /api/user/profile/{userId}     // 更新用户资料
GET    /api/user/statistics/{userId}  // 获取学习统计

// 排行榜API
GET    /api/leaderboard/daily         // 日排行榜
GET    /api/leaderboard/weekly        // 周排行榜
GET    /api/leaderboard/monthly       // 月排行榜

// 挑战系统API
GET    /api/challenges/daily          // 每日挑战
POST   /api/challenges/complete       // 完成挑战
GET    /api/challenges/history        // 挑战历史
```

## 7. 项目规划

### 7.1 开发阶段划分

#### 第一阶段: 基础设施建设 (第1周)
**目标**: 建立项目开发基础设施
- [ ] 数据库schema设计和迁移
- [ ] 核心API端点开发
- [ ] SM-2算法实现和测试
- [ ] 基础UI组件库建设

#### 第二阶段: 核心功能开发 (第2-3周)  
**目标**: 实现主要学习功能模块
- [ ] 汉英对照学习模块完整实现
- [ ] 拖拽交互和实时验证系统
- [ ] 音频播放和TTS集成
- [ ] 用户进度追踪系统

#### 第三阶段: 高级功能开发 (第4-5周)
**目标**: 增强用户体验和学习效果
- [ ] 听力/口语训练模块
- [ ] 学习数据分析系统
- [ ] 个性化推荐引擎
- [ ] 实际场景练习内容

#### 第四阶段: 用户体验优化 (第6-7周)
**目标**: 优化性能和用户体验
- [ ] 界面美化和交互优化
- [ ] 移动端适配和响应式设计
- [ ] 性能优化和缓存策略
- [ ] 离线功能和PWA支持

#### 第五阶段: 测试和上线 (第8周)
**目标**: 确保系统稳定性和用户满意度
- [ ] 全面系统测试和性能测试
- [ ] 用户体验测试和反馈收集
- [ ] 安全审计和漏洞修复
- [ ] 正式上线和监控部署

### 7.2 里程碑节点

| 里程碑 | 时间节点 | 主要交付物 | 验收标准 |
|--------|----------|------------|----------|
| M1: 技术基础 | 第1周末 | 数据库schema、基础API | 所有API测试通过，数据库正常运行 |
| M2: 核心功能 | 第3周末 | 汉英学习模块、进度系统 | 核心学习流程完整可用 |
| M3: 高级功能 | 第5周末 | 听说训练、数据分析 | 所有主要功能模块可用 |
| M4: 用户体验 | 第7周末 | UI优化、移动适配 | 用户体验测试评分>4.0 |
| M5: 产品上线 | 第8周末 | 完整产品系统 | 所有验收标准达成 |

### 7.3 资源配置

#### 人员配置
- **项目负责人**: 1人，负责整体协调和质量控制
- **前端开发**: 1人，负责用户界面和交互实现  
- **后端开发**: 1人，负责API和数据库开发
- **UI/UX设计**: 1人，负责界面设计和用户体验
- **测试工程师**: 1人，负责质量保证和测试

#### 技术资源
- **开发环境**: 本地开发 + 云端测试环境
- **数据库**: SQLite (开发) + PostgreSQL (生产考虑)
- **部署平台**: Vercel或自托管服务器
- **第三方服务**: TTS语音服务、CDN加速

### 7.4 风险控制

#### 主要风险识别
1. **技术风险**: 语音识别精度不达标
2. **性能风险**: 用户并发导致系统响应缓慢
3. **内容风险**: 学习内容质量和版权问题
4. **用户体验风险**: 学习曲线过陡影响用户留存

#### 风险缓解措施
- **技术风险**: 多重fallback机制，渐进式功能发布
- **性能风险**: 性能测试和优化，缓存策略实施
- **内容风险**: 内容审核流程，开源内容使用
- **用户体验风险**: 用户测试和反馈循环，迭代优化

## 8. 数据指标

### 8.1 关键成功指标(KPI)

#### 用户增长指标
- **新用户注册**: 目标100+/周
- **日活用户(DAU)**: 目标500+/日 (3个月后)
- **月活用户(MAU)**: 目标2000+/月 (3个月后)
- **用户留存率**: 日留存>70%，周留存>40%，月留存>20%

#### 学习效果指标  
- **学习完成率**: 单session完成率>80%
- **准确率提升**: 30天内平均提升15%
- **学习时长**: 平均session时长15+分钟
- **知识保持率**: 7天后复习准确率>75%

#### 产品使用指标
- **功能使用率**: 所有主要功能使用率>60%
- **每日挑战完成率**: >40%
- **音频功能使用率**: >70%
- **移动端使用占比**: >50%

### 8.2 数据埋点需求

#### 用户行为埋点
```javascript
// 学习行为追踪
trackLearningAttempt({
  userId: string,
  contentId: string,
  mode: 'chinese-english' | 'word-blitz' | 'listening',
  accuracy: number,
  timeSpent: number,
  hintsUsed: number
});

// 功能使用埋点
trackFeatureUsage({
  userId: string,
  feature: string,
  action: 'start' | 'complete' | 'abandon',
  timestamp: Date,
  metadata: object
});

// 性能监控埋点
trackPerformance({
  page: string,
  loadTime: number,
  apiResponseTime: number,
  errorCount: number
});
```

### 8.3 数据监控方案

#### 实时监控面板
- **系统健康状态**: CPU、内存、响应时间
- **用户活动**: 当前在线用户、学习活动热图
- **错误监控**: 错误率、错误类型分布
- **业务指标**: 实时学习完成数、用户互动数

#### 定期数据报告
- **日报**: 核心KPI、系统性能、用户反馈
- **周报**: 用户增长、学习效果分析、功能使用统计  
- **月报**: 整体业务指标、用户画像分析、产品迭代建议

## 9. 竞品分析

### 9.1 主要竞争对手

#### 直接竞争对手
1. **多邻国(Duolingo)**
   - 优势: 游戏化设计、全球用户基数大
   - 劣势: 中文用户体验一般、缺乏深度语法训练

2. **百词斩**  
   - 优势: 图像记忆法、中国用户体验好
   - 劣势: 主要专注单词记忆、缺乏句子构建训练

3. **ELSA Speak**
   - 优势: AI发音纠正、专业语音识别
   - 劣势: 主要专注发音、缺乏综合学习体系

#### 间接竞争对手
- 传统英语培训机构
- 在线教育平台(如VIPKID)
- 英语学习APP(如扇贝、墨墨背单词)

### 9.2 差异化策略

#### 核心差异点
1. **科学算法**: SM-2间隔重复算法的深度应用
2. **沉浸式学习**: 汉英对照的渐进式语言习得
3. **全技能整合**: 听说读写一体化训练
4. **个性化适应**: 基于学习数据的智能推荐

#### 创新优势
- **Earthworm方法论**: 借鉴连接式语言学习理论
- **智能拖拽**: 创新的句子构建交互方式  
- **文化融合**: 针对中文用户的本土化设计
- **开源生态**: 基于开源技术栈的可持续发展

### 9.3 竞争优势

#### 技术优势
- 轻量级技术栈，响应速度快
- PWA支持，离线学习能力
- 开源架构，快速迭代能力
- 现代化UI，用户体验优秀

#### 产品优势  
- 科学的学习算法，效果显著
- 适合中文用户的学习路径
- 全面的技能训练体系
- 个性化的学习体验

## 10. 商业模式

### 10.1 变现方式

#### 免费增值模式
- **基础功能**: 每日限定学习次数，基础内容免费
- **高级会员**: 无限制学习、高级内容、数据分析报告
- **年度会员**: 全功能解锁、专属客服、优先体验新功能

#### 教育服务
- **学习计划定制**: 针对特定目标的学习路径规划
- **一对一辅导**: 连接优质英语教师资源
- **企业培训**: 面向企业的团队英语培训解决方案

#### 内容授权
- **课程内容**: 向其他教育平台授权学习内容
- **技术方案**: SM-2算法和学习系统的技术授权
- **白标方案**: 为其他机构提供定制化学习平台

### 10.2 收入预测

#### 用户增长预测
```
月份 1-3: 免费用户积累期，目标2000+ MAU
月份 4-6: 付费转化期，目标10%付费转化率  
月份 7-12: 规模化增长期，目标5000+ MAU，15%付费率
```

#### 收入结构预测 (6个月后)
- **会员订阅**: 60% (月费¥29，年费¥199)
- **增值服务**: 25% (个人定制、企业培训)  
- **内容授权**: 10% (B2B授权收入)
- **广告收入**: 5% (教育相关广告)

### 10.3 成本分析

#### 主要成本构成
- **技术成本**: 20% (服务器、第三方服务、开发工具)
- **人员成本**: 50% (开发、运营、客服团队)
- **内容成本**: 15% (内容制作、版权、翻译)  
- **营销成本**: 10% (用户获取、品牌推广)
- **运营成本**: 5% (日常运营、管理费用)

#### 盈亏平衡分析
- **目标用户数**: 2000+ MAU
- **付费转化率**: 10%  
- **平均月ARPU**: ¥35
- **月收入目标**: ¥70,000
- **预计盈亏平衡**: 运营第8个月

---

## 结论

本PRD文档详细规划了英语学习网站完善项目的产品需求、技术实现和商业模式。通过科学的SM-2算法、创新的汉英对照学习模式和全面的技能训练体系，该产品将为中文用户提供高效、个性化的英语学习体验。

项目将分8周完成开发，通过MVP验证、迭代优化的方式，确保产品质量和用户满意度。预期在运营第8个月实现盈亏平衡，成为英语学习领域的差异化产品。

**下一步行动**:
1. 技术架构评审和确认
2. 开发团队组建和任务分配  
3. MVP原型开发启动
4. 用户调研和反馈收集机制建立