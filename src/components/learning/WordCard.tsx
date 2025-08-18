// src/components/learning/WordCard.tsx - 单词学习卡片组件
'use client'

import { useState, useRef } from 'react'

interface WordData {
  id: string
  word: string
  phonetic: string
  meaning: string
  example: string
  audioUrl?: string
  difficulty: 'easy' | 'medium' | 'hard'
  masteryLevel: 'new' | 'learning' | 'mastered'
}

interface WordCardProps {
  wordData: WordData
  onAnswer: (correct: boolean) => void
  showAnswer?: boolean
  onPronounce?: (word: string) => void
}

export default function WordCard({ 
  wordData, 
  onAnswer, 
  showAnswer = false,
  onPronounce 
}: WordCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // 播放单词发音
  const playPronunciation = async () => {
    if (isPlaying) return

    setIsPlaying(true)

    try {
      if (wordData.audioUrl) {
        // 使用预设的音频文件
        if (audioRef.current) {
          audioRef.current.src = wordData.audioUrl
          await audioRef.current.play()
        }
      } else {
        // 使用浏览器语音合成 API
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(wordData.word)
          utterance.lang = 'en-US'
          utterance.rate = 0.8
          utterance.pitch = 1
          
          // 语音结束后重置状态
          utterance.onend = () => {
            setIsPlaying(false)
          }
          
          speechSynthesis.speak(utterance)
        }
      }

      // 回调父组件的发音事件
      onPronounce?.(wordData.word)
    } catch (error) {
      console.error('发音播放失败:', error)
      setIsPlaying(false)
    }
  }

  // 处理音频播放结束
  const handleAudioEnd = () => {
    setIsPlaying(false)
  }

  // 翻转卡片显示答案
  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  // 处理答题
  const handleAnswer = (correct: boolean) => {
    onAnswer(correct)
    // 答题后重置卡片状态
    setTimeout(() => {
      setIsFlipped(false)
    }, 500)
  }

  // 获取掌握程度的样式类名
  const getMasteryClass = () => {
    switch (wordData.masteryLevel) {
      case 'mastered':
        return 'border-green-400 bg-green-50'
      case 'learning':
        return 'border-yellow-400 bg-yellow-50'
      default:
        return 'border-gray-300 bg-white'
    }
  }

  // 获取难度标识颜色
  const getDifficultyColor = () => {
    switch (wordData.difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`word-card max-w-md mx-auto ${getMasteryClass()}`}>
      {/* 隐藏的音频元素 */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnd}
        preload="none"
      />

      {/* 卡片头部 - 难度和掌握程度指示器 */}
      <div className="flex justify-between items-center mb-4">
        <span className={`learning-indicator ${wordData.masteryLevel}`}>
          {wordData.masteryLevel === 'mastered' && '已掌握'}
          {wordData.masteryLevel === 'learning' && '学习中'}
          {wordData.masteryLevel === 'new' && '新单词'}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor()}`}>
          {wordData.difficulty === 'easy' && '简单'}
          {wordData.difficulty === 'medium' && '中等'}
          {wordData.difficulty === 'hard' && '困难'}
        </span>
      </div>

      {/* 卡片主内容 */}
      <div className={`transition-transform duration-300 ${isFlipped ? 'transform rotateY-180' : ''}`}>
        {!isFlipped ? (
          // 正面：显示单词和音标
          <div className="text-center py-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              {wordData.word}
            </h2>
            
            {wordData.phonetic && (
              <p className="text-lg text-gray-600 mb-4">
                [{wordData.phonetic}]
              </p>
            )}

            {/* 发音按钮 */}
            <button
              onClick={playPronunciation}
              disabled={isPlaying}
              className={`pronunciation-btn btn-secondary mb-6 ${isPlaying ? 'playing' : ''}`}
            >
              {isPlaying ? (
                <div className="flex items-center">
                  <div className="animate-pulse w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
                  播放中...
                </div>
              ) : (
                <>
                  🔊 播放发音
                </>
              )}
            </button>

            {/* 翻转按钮 */}
            <div>
              <button
                onClick={handleFlip}
                className="btn-primary"
              >
                查看释义
              </button>
            </div>
          </div>
        ) : (
          // 背面：显示释义和例句
          <div className="py-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                {wordData.word}
              </h3>
              <p className="text-xl text-gray-700 mb-4">
                {wordData.meaning}
              </p>
              
              {wordData.example && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium mb-1">例句：</p>
                  <p className="text-gray-800 italic">
                    {wordData.example}
                  </p>
                </div>
              )}
            </div>

            {/* 答题按钮 */}
            {showAnswer && (
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => handleAnswer(false)}
                  className="btn-secondary bg-red-100 hover:bg-red-200 text-red-700"
                >
                  ❌ 不认识
                </button>
                <button
                  onClick={() => handleAnswer(true)}
                  className="btn-secondary bg-green-100 hover:bg-green-200 text-green-700"
                >
                  ✅ 认识
                </button>
              </div>
            )}

            {/* 返回按钮 */}
            <div className="text-center mt-4">
              <button
                onClick={handleFlip}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                返回单词
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}