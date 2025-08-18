// app/dashboard/review/page.tsx - 错题回顾页面
'use client'

import { useState, useEffect } from 'react'
import WordCard from '@/src/components/learning/WordCard'
import { UserAnalytics } from '@/src/lib/analytics'

interface WrongAnswer {
  id: string
  wordId: string
  word: string
  phonetic: string
  meaning: string
  example: string
  difficulty: 'easy' | 'medium' | 'hard'
  masteryLevel: 'new' | 'learning' | 'mastered'
  wrongCount: number
  lastWrongDate: string
  correctRate: number
  topic: string
}

interface ReviewStats {
  totalWrongAnswers: number
  mostMissedWords: string[]
  weakestTopics: string[]
  improvementRate: number
}

export default function ReviewPage() {
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [reviewMode, setReviewMode] = useState<'list' | 'practice'>('list')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'frequent'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadReviewData()
  }, [selectedFilter])

  // 加载错题回顾数据
  const loadReviewData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // 模拟错题数据（实际项目中从 API 获取）
      const mockWrongAnswers: WrongAnswer[] = [
        {
          id: '1',
          wordId: 'abandon',
          word: 'abandon',
          phonetic: 'əˈbændən',
          meaning: 'v. 放弃，抛弃；沉溺于',
          example: 'He had to abandon his car in the snow.',
          difficulty: 'medium',
          masteryLevel: 'learning',
          wrongCount: 3,
          lastWrongDate: '2024-01-15T10:30:00Z',
          correctRate: 40,
          topic: '高频词汇'
        },
        {
          id: '2',
          wordId: 'sophisticated',
          word: 'sophisticated',
          phonetic: 'səˈfɪstɪkeɪtɪd',
          meaning: 'adj. 复杂的；精致的；老练的',
          example: 'She has sophisticated tastes in art.',
          difficulty: 'hard',
          masteryLevel: 'learning',
          wrongCount: 5,
          lastWrongDate: '2024-01-14T15:20:00Z',
          correctRate: 20,
          topic: '形容词'
        },
        {
          id: '3',
          wordId: 'particular',
          word: 'particular',
          phonetic: 'pərˈtɪkjələr',
          meaning: 'adj. 特别的；挑剔的；详细的',
          example: 'Is there any particular style you prefer?',
          difficulty: 'medium',
          masteryLevel: 'learning',
          wrongCount: 2,
          lastWrongDate: '2024-01-16T09:15:00Z',
          correctRate: 60,
          topic: '形容词'
        },
        {
          id: '4',
          wordId: 'consequence',
          word: 'consequence',
          phonetic: 'ˈkɑːnsəkwəns',
          meaning: 'n. 结果；后果；重要性',
          example: 'The consequence of his actions was severe.',
          difficulty: 'medium',
          masteryLevel: 'learning',
          wrongCount: 4,
          lastWrongDate: '2024-01-13T14:45:00Z',
          correctRate: 25,
          topic: '名词'
        }
      ]

      const stats: ReviewStats = {
        totalWrongAnswers: mockWrongAnswers.length,
        mostMissedWords: ['sophisticated', 'consequence', 'abandon'],
        weakestTopics: ['形容词', '名词', '高频词汇'],
        improvementRate: 15
      }

      setWrongAnswers(mockWrongAnswers)
      setReviewStats(stats)
    } catch (error) {
      console.error('加载错题数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 处理答题
  const handleAnswer = async (correct: boolean) => {
    const currentWord = filteredWords[currentWordIndex]
    
    try {
      const token = localStorage.getItem('token')
      
      // 发送答题结果到服务器
      await fetch('/api/progress/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          wordId: currentWord.wordId,
          word: currentWord.word,
          isCorrect: correct,
          quality: correct ? 4 : 1, // 简化的质量评分
          sessionType: 'review'
        })
      })

      // 如果答对了，从错题列表中移除或更新
      if (correct) {
        setWrongAnswers(prev => 
          prev.map(item => 
            item.id === currentWord.id 
              ? { ...item, correctRate: Math.min(item.correctRate + 20, 100) }
              : item
          )
        )
      }

      // 跳转到下一题
      if (currentWordIndex < filteredWords.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1)
      } else {
        setReviewMode('list')
        setCurrentWordIndex(0)
      }

      // 跟踪学习进度
      UserAnalytics.getInstance().trackLearningProgress(
        currentWord.wordId, 
        correct, 
        1
      )
    } catch (error) {
      console.error('保存答题结果失败:', error)
    }
  }

  // 过滤错题
  const filteredWords = wrongAnswers.filter(word => {
    // 搜索过滤
    if (searchTerm && !word.word.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    
    // 类型过滤
    switch (selectedFilter) {
      case 'recent':
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        return new Date(word.lastWrongDate) > threeDaysAgo
      case 'frequent':
        return word.wrongCount >= 3
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (reviewMode === 'practice' && filteredWords.length > 0) {
    return (
      <div className="p-6">
        {/* 练习模式头部 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setReviewMode('list')}
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              ← 返回错题列表
            </button>
            <div className="text-sm text-gray-600">
              {currentWordIndex + 1} / {filteredWords.length}
            </div>
          </div>
          
          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentWordIndex + 1) / filteredWords.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 单词卡片 */}
        <div className="max-w-2xl mx-auto">
          <WordCard
            wordData={{
              id: filteredWords[currentWordIndex].wordId,
              word: filteredWords[currentWordIndex].word,
              phonetic: filteredWords[currentWordIndex].phonetic,
              meaning: filteredWords[currentWordIndex].meaning,
              example: filteredWords[currentWordIndex].example,
              difficulty: filteredWords[currentWordIndex].difficulty,
              masteryLevel: filteredWords[currentWordIndex].masteryLevel
            }}
            onAnswer={handleAnswer}
            showAnswer={true}
          />
          
          {/* 错误统计信息 */}
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">错误记录</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-red-600">错误次数:</span>
                <span className="ml-2 font-medium">{filteredWords[currentWordIndex].wrongCount}</span>
              </div>
              <div>
                <span className="text-red-600">正确率:</span>
                <span className="ml-2 font-medium">{filteredWords[currentWordIndex].correctRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题和统计 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">错题回顾</h1>
        <p className="text-gray-600">复习之前做错的单词，提高学习效率</p>
        
        {reviewStats && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{reviewStats.totalWrongAnswers}</div>
              <div className="text-red-800 text-sm">待复习错题</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">{reviewStats.mostMissedWords.length}</div>
              <div className="text-yellow-800 text-sm">高频错词</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{reviewStats.weakestTopics.length}</div>
              <div className="text-blue-800 text-sm">薄弱知识点</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">+{reviewStats.improvementRate}%</div>
              <div className="text-green-800 text-sm">进步幅度</div>
            </div>
          </div>
        )}
      </div>

      {/* 过滤和搜索 */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex space-x-2">
          {([
            { key: 'all', label: '全部错题' },
            { key: 'recent', label: '最近错误' },
            { key: 'frequent', label: '高频错误' }
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedFilter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        
        <div className="flex space-x-4">
          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜索单词..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              🔍
            </div>
          </div>
          
          {/* 开始练习按钮 */}
          {filteredWords.length > 0 && (
            <button
              onClick={() => {
                setReviewMode('practice')
                setCurrentWordIndex(0)
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              开始练习 ({filteredWords.length})
            </button>
          )}
        </div>
      </div>

      {/* 错题列表 */}
      {filteredWords.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🎉</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? '没有找到匹配的错题' : '太棒了！没有错题需要复习'}
          </h3>
          <p className="text-gray-600">
            {searchTerm ? '尝试调整搜索条件' : '继续学习新单词保持进步'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWords.map((word) => (
            <div
              key={word.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{word.word}</h3>
                    <span className="text-gray-500">[{word.phonetic}]</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      word.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      word.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {word.difficulty === 'easy' && '简单'}
                      {word.difficulty === 'medium' && '中等'}
                      {word.difficulty === 'hard' && '困难'}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{word.meaning}</p>
                  <p className="text-gray-600 text-sm italic">"{word.example}"</p>
                  <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                    <span>错误 {word.wrongCount} 次</span>
                    <span>正确率 {word.correctRate}%</span>
                    <span>最近错误: {new Date(word.lastWrongDate).toLocaleDateString('zh-CN')}</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">{word.topic}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    word.correctRate >= 80 ? 'bg-green-100' :
                    word.correctRate >= 60 ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    <span className={`text-lg ${
                      word.correctRate >= 80 ? 'text-green-600' :
                      word.correctRate >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {word.correctRate >= 80 ? '😊' : word.correctRate >= 60 ? '😐' : '😞'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentWordIndex(filteredWords.findIndex(w => w.id === word.id))
                      setReviewMode('practice')
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    单独练习
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}