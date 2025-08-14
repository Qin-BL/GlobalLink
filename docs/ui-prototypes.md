# UI/UX Prototypes for Enhanced English Learning Platform

## 1. Main Navigation Enhancement

### Current Structure Enhancement
```
app/
├── page.tsx                    // Enhanced dashboard
├── play/
│   ├── word-blitz/            // Existing
│   ├── chinese-english/       // NEW: Chinese to English mode
│   └── conjunction-builder/   // NEW: Earthworm-style mode
├── learn/
│   ├── sentence-builder/      // Existing
│   └── grammar-patterns/      // NEW: Pattern-based learning
└── challenges/                // NEW: Daily challenges
    └── page.tsx
```

### Enhanced Dashboard Prototype
```jsx
// Enhanced Main Dashboard (app/page.tsx)
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header with progress overview */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">英语学习平台</h1>
        <div className="flex gap-4 text-sm">
          <div className="bg-white rounded-lg px-4 py-2 shadow">
            <span className="text-gray-500">今日学习: </span>
            <span className="font-semibold text-green-600">15分钟</span>
          </div>
          <div className="bg-white rounded-lg px-4 py-2 shadow">
            <span className="text-gray-500">连续天数: </span>
            <span className="font-semibold text-orange-600">7天</span>
          </div>
          <div className="bg-white rounded-lg px-4 py-2 shadow">
            <span className="text-gray-500">总积分: </span>
            <span className="font-semibold text-purple-600">1,250</span>
          </div>
        </div>
      </header>

      {/* Game Mode Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Existing Word Blitz */}
        <GameModeCard 
          title="百词斩"
          subtitle="Word Blitz"
          description="看图选词，快速记忆"
          icon="🎯"
          difficulty="初级"
          href="/play/word-blitz"
          gradient="from-red-400 to-pink-500"
        />
        
        {/* Existing Sentence Builder */}
        <GameModeCard 
          title="连词造句"
          subtitle="Sentence Builder" 
          description="拖拽组词，构建句子"
          icon="🧩"
          difficulty="中级"
          href="/learn/sentence-builder"
          gradient="from-blue-400 to-cyan-500"
        />
        
        {/* NEW: Chinese to English */}
        <GameModeCard 
          title="汉字拼英文"
          subtitle="Chinese to English"
          description="看中文，拼英文句子"
          icon="🎭"
          difficulty="中级"
          href="/play/chinese-english"
          gradient="from-green-400 to-emerald-500"
          isNew={true}
        />
        
        {/* NEW: Conjunction Builder */}
        <GameModeCard 
          title="连词造句进阶"
          subtitle="Conjunction Master"
          description="掌握语法结构规律"
          icon="🔗"
          difficulty="高级"
          href="/play/conjunction-builder"
          gradient="from-purple-400 to-violet-500"
          isNew={true}
        />
        
        {/* NEW: Grammar Patterns */}
        <GameModeCard 
          title="语法模式"
          subtitle="Grammar Patterns"
          description="系统学习语法规则"
          icon="📚"
          difficulty="中高级"
          href="/learn/grammar-patterns"
          gradient="from-orange-400 to-amber-500"
          isNew={true}
        />
        
        {/* NEW: Daily Challenge */}
        <GameModeCard 
          title="每日挑战"
          subtitle="Daily Challenge"
          description="限时挑战，赢取奖励"
          icon="⚡"
          difficulty="混合"
          href="/challenges"
          gradient="from-indigo-400 to-blue-500"
          isSpecial={true}
        />
      </div>

      {/* Quick Stats & Leaderboard */}
      <div className="grid md:grid-cols-2 gap-6">
        <QuickProgress />
        <Leaderboard />
      </div>
    </div>
  );
}

// Reusable Game Mode Card Component
function GameModeCard({ title, subtitle, description, icon, difficulty, href, gradient, isNew, isSpecial }) {
  return (
    <div className={`relative bg-gradient-to-br ${gradient} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}>
      {isNew && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          NEW
        </div>
      )}
      {isSpecial && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded-full animate-bounce">
          ⭐
        </div>
      )}
      
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-sm opacity-90 mb-2">{subtitle}</p>
      <p className="text-sm opacity-80 mb-4">{description}</p>
      
      <div className="flex justify-between items-center">
        <span className="text-xs bg-white bg-opacity-20 px-3 py-1 rounded-full">
          {difficulty}
        </span>
        <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          开始学习
        </button>
      </div>
    </div>
  );
}
```

## 2. Chinese-to-English Game Interface

### Game Screen Layout
```jsx
// Chinese to English Game Page (app/play/chinese-english/page.tsx)
export default function ChineseEnglishGame() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-blue-50 p-4">
      {/* Header with score and progress */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
            <span className="text-sm text-gray-500">积分: </span>
            <span className="font-bold text-blue-600">1,250</span>
          </div>
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
            <span className="text-sm text-gray-500">连击: </span>
            <span className="font-bold text-red-500">🔥 12</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md">💡</button>
          <button className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md">🔊</button>
          <button className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md">⚙️</button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>当前进度</span>
          <span>7/20 完成</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500" 
               style={{width: '35%'}}></div>
        </div>
      </div>

      {/* Chinese prompt section */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-2">请将下面的中文翻译成英文</div>
          <div className="text-2xl font-bold text-gray-800 mb-4">我每天早上七点起床。</div>
          
          {/* Hint panel (conditionally shown) */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="text-sm text-yellow-700">
              💡 提示: 这是一个描述日常习惯的句子 (Present Simple)
            </div>
          </div>
          
          <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm transition-colors">
            🔊 播放中文发音
          </button>
        </div>
      </div>

      {/* Construction area */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
        <div className="text-sm text-gray-500 mb-3">你的答案:</div>
        <div className="min-h-20 border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
          {/* Constructed sentence tokens */}
          <div className="flex flex-wrap gap-2">
            <TokenChip text="I" isCorrect={true} />
            <TokenChip text="get" isCorrect={false} />
            <TokenChip text="up" isCorrect={true} />
            <TokenChip text="at" isCorrect={true} />
            <div className="w-8 h-8 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
              <span className="text-blue-400 text-xs">?</span>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
            ↶ 撤销
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            ✓ 提交答案
          </button>
        </div>
      </div>

      {/* Word token pool */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="text-sm text-gray-500 mb-4">选择单词组成句子:</div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <WordToken text="I" />
          <WordToken text="wake" />
          <WordToken text="up" />
          <WordToken text="at" />
          <WordToken text="seven" />
          <WordToken text="o'clock" />
          <WordToken text="every" />
          <WordToken text="morning" />
          <WordToken text="usually" isDistractor={true} />
          <WordToken text="sometimes" isDistractor={true} />
        </div>
      </div>

      {/* Feedback modal (shown after submission) */}
      <FeedbackModal 
        isCorrect={false}
        userAnswer="I get up at seven o'clock every morning"
        correctAnswer="I wake up at seven o'clock every morning"
        mistakes={[{position: 1, word: "get", shouldBe: "wake"}]}
        points={85}
        explanation="'Wake up' 是起床的正确表达，'get up' 也正确但 'wake up' 更常用。"
      />
    </div>
  );
}

// Reusable components
function TokenChip({ text, isCorrect }) {
  return (
    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
      isCorrect ? 'bg-green-100 text-green-700 border border-green-300' : 
                  'bg-red-100 text-red-700 border border-red-300'
    }`}>
      {text}
    </div>
  );
}

function WordToken({ text, isDistractor }) {
  return (
    <button className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
      isDistractor ? 'bg-gray-100 border-gray-300 text-gray-600' :
                     'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
    }`}>
      {text}
    </button>
  );
}
```

## 3. Conjunction Builder Mode (Earthworm Style)

### Advanced Grammar Learning Interface
```jsx
// Conjunction Builder Game (app/play/conjunction-builder/page.tsx)
export default function ConjunctionBuilder() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-50 p-4">
      {/* Grammar pattern explanation */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            🔗
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Present Simple Pattern</h2>
            <p className="text-sm text-gray-600">主语 + 动词 + 宾语</p>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-700 mb-2">模式结构:</div>
          <div className="flex gap-2 items-center">
            <PatternBlock text="Subject" color="bg-blue-100 text-blue-700" />
            <span className="text-gray-400">+</span>
            <PatternBlock text="Verb" color="bg-green-100 text-green-700" />
            <span className="text-gray-400">+</span>
            <PatternBlock text="Object" color="bg-orange-100 text-orange-700" />
          </div>
        </div>
      </div>

      {/* Practice sentence */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-gray-800 mb-2">我喜欢苹果。</div>
          <div className="text-sm text-gray-500">使用学到的语法模式构建英文句子</div>
        </div>

        {/* Pattern-based construction */}
        <div className="space-y-4">
          <ConstructionSlot 
            label="Subject (主语)"
            placeholder="谁在做这个动作?"
            selectedToken="I"
            color="bg-blue-50 border-blue-300"
          />
          <ConstructionSlot 
            label="Verb (动词)" 
            placeholder="做什么动作?"
            selectedToken="like"
            color="bg-green-50 border-green-300"
          />
          <ConstructionSlot 
            label="Object (宾语)"
            placeholder="对什么/谁做动作?"
            selectedToken="apples"
            color="bg-orange-50 border-orange-300"
          />
        </div>

        {/* Result preview */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-2">句子预览:</div>
          <div className="text-lg font-medium text-gray-800">I like apples.</div>
        </div>
      </div>

      {/* Token pool organized by type */}
      <div className="grid md:grid-cols-3 gap-4">
        <TokenPool title="Subjects" color="blue" tokens={["I", "You", "He", "She", "We", "They"]} />
        <TokenPool title="Verbs" color="green" tokens={["like", "love", "eat", "drink", "study", "play"]} />
        <TokenPool title="Objects" color="orange" tokens={["apples", "books", "music", "coffee", "games", "movies"]} />
      </div>
    </div>
  );
}

function PatternBlock({ text, color }) {
  return (
    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${color}`}>
      {text}
    </div>
  );
}

function ConstructionSlot({ label, placeholder, selectedToken, color }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className={`border-2 border-dashed rounded-lg p-4 min-h-12 flex items-center ${color}`}>
        {selectedToken ? (
          <div className="bg-white px-3 py-1 rounded-lg shadow-sm font-medium">
            {selectedToken}
          </div>
        ) : (
          <span className="text-gray-500 italic">{placeholder}</span>
        )}
      </div>
    </div>
  );
}

function TokenPool({ title, color, tokens }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200', 
    orange: 'bg-orange-50 border-orange-200'
  };

  return (
    <div className={`bg-white rounded-xl p-4 shadow-lg border ${colorClasses[color]}`}>
      <h3 className="font-medium text-gray-700 mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {tokens.map(token => (
          <button key={token} className="p-2 bg-white border rounded-lg hover:shadow-sm transition-shadow text-sm">
            {token}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## 4. Daily Challenge Interface

### Gamified Challenge System
```jsx
// Daily Challenge Page (app/challenges/page.tsx)
export default function DailyChallenges() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 p-4">
      {/* Challenge header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">每日挑战</h1>
        <p className="text-gray-600">完成挑战获得额外奖励！</p>
        
        {/* Countdown timer */}
        <div className="bg-white rounded-xl p-4 mt-4 shadow-lg inline-block">
          <div className="text-sm text-gray-500 mb-1">距离重置还有</div>
          <div className="text-2xl font-bold text-orange-600">23:42:15</div>
        </div>
      </div>

      {/* Today's challenges */}
      <div className="space-y-4 mb-8">
        <ChallengeCard 
          title="词汇大师"
          description="在Word Blitz模式中连续答对20个词汇"
          progress={15}
          total={20}
          reward="50积分 + 🏆 词汇徽章"
          difficulty="中等"
          isCompleted={false}
        />
        
        <ChallengeCard 
          title="造句专家" 
          description="在10分钟内完成15个sentence builder练习"
          progress={15}
          total={15}
          reward="100积分 + ⚡ 速度徽章"
          difficulty="困难"
          isCompleted={true}
        />
        
        <ChallengeCard 
          title="翻译高手"
          description="在Chinese-English模式中获得90%以上准确率"
          progress={8}
          total={10}
          reward="75积分 + 🎯 精准徽章"
          difficulty="中等"
          isCompleted={false}
        />
      </div>

      {/* Weekly challenges */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4">本周挑战</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <WeeklyChallengeCard 
            title="学习坚持者"
            description="连续7天完成学习任务"
            progress={5}
            total={7}
            reward="300积分 + 🔥 坚持徽章"
          />
          <WeeklyChallengeCard 
            title="全能学霸"
            description="尝试所有4种游戏模式"
            progress={3}
            total={4}
            reward="200积分 + 🌟 全能徽章"
          />
        </div>
      </div>
    </div>
  );
}

function ChallengeCard({ title, description, progress, total, reward, difficulty, isCompleted }) {
  const progressPercent = (progress / total) * 100;
  
  return (
    <div className={`bg-white rounded-xl p-6 shadow-lg border-l-4 ${
      isCompleted ? 'border-green-500' : 'border-blue-500'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          difficulty === '困难' ? 'bg-red-100 text-red-700' :
          difficulty === '中等' ? 'bg-yellow-100 text-yellow-700' :
                                 'bg-green-100 text-green-700'
        }`}>
          {difficulty}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>进度</span>
          <span>{progress}/{total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              isCompleted ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{width: `${progressPercent}%`}}
          ></div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm">
          <span className="text-gray-500">奖励: </span>
          <span className="font-medium text-orange-600">{reward}</span>
        </div>
        {isCompleted ? (
          <span className="text-green-600 font-medium">✅ 已完成</span>
        ) : (
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            开始挑战
          </button>
        )}
      </div>
    </div>
  );
}
```

## 5. Mobile Responsive Design

### Key Mobile Optimizations
- **Touch-friendly tokens**: Minimum 44px touch targets
- **Swipe gestures**: Left/right swipe for navigation
- **Adaptive layouts**: Stack cards vertically on mobile
- **Large text**: Minimum 16px for readability
- **Quick actions**: Floating action buttons
- **Offline support**: Cache content for offline play

These prototypes provide a comprehensive foundation for implementing the enhanced English learning platform with Earthworm-inspired features while maintaining the existing architecture and user experience principles.