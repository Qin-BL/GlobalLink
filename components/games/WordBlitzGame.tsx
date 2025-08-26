'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Flame, CheckCircle, XCircle, PartyPopper, Star, ThumbsUp, Dumbbell, BookOpen } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface Word {
  id: number;
  term: string;
  meaning: string;
  imageUrl?: string;
  audioUrl?: string;
  level: number;
}

interface WordBlitzGameProps {
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  timeLimit?: number; // 时间限制（秒）
  onGameEnd?: (results: GameResults) => void;
}

interface GameResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeSpent: number;
  streakCount: number;
}

interface Question {
  word: Word;
  options: string[];
  correctAnswer: string;
  type: 'english-to-chinese' | 'chinese-to-english';
}

// 从packages数据加载词汇
let cachedWords: Word[] = [];
let currentCourseId: string | null = null;

// 从课程数据生成词汇数据
async function loadWordsFromCourse(courseId: string): Promise<Word[]> {
  try {
    // 如果已经缓存了相同课程的数据，直接返回
    if (currentCourseId === courseId && cachedWords.length > 0) {
      return cachedWords;
    }

    const response = await fetch(`/api/courses/${courseId.padStart(2, '0')}`);
    if (!response.ok) {
      throw new Error('Failed to load course data');
    }

    const courseItems = await response.json();
    
    // 筛选出适合单词练习的数据（单个单词或短语）
    const wordItems = courseItems.filter((item: any) => 
      item.english.split(' ').length <= 3 && item.chinese.length <= 10
    );

    const words: Word[] = wordItems.map((item: any, index: number) => {
      // 根据单词长度和复杂度确定等级
      const level = determineWordLevel(item.english, item.chinese);
      
      return {
        id: index + 1,
        term: item.english,
        meaning: item.chinese,
        level,
      };
    });

    // 缓存数据
    cachedWords = words;
    currentCourseId = courseId;
    
    return words;
  } catch (error) {
    console.error('Error loading words from course:', error);
    // 出错时返回空数组（不再使用硬编码示例数据）
    return [] as Word[];
  }
}

// 确定单词等级
function determineWordLevel(english: string, chinese: string): number {
  const englishLength = english.length;
  const wordCount = english.split(' ').length;
  
  // 基于单词长度和复杂度确定等级
  if (wordCount === 1 && englishLength <= 5) {
    return 1; // 简单单词
  } else if (wordCount <= 2 && englishLength <= 10) {
    return 2; // 中等单词或短语
  } else {
    return 3; // 复杂单词或长短语
  }
}

export default function WordBlitzGame({ 
  difficulty = 'beginner', 
  timeLimit = 60,
  onGameEnd 
}: WordBlitzGameProps) {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [streakCount, setStreakCount] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [noData, setNoData] = useState(false);
  const searchParams = useSearchParams();

  // 根据难度等级筛选词汇
  const getWordsByDifficulty = useCallback(async () => {
    const levelMap = {
      'beginner': [1],
      'intermediate': [1, 2],
      'advanced': [2, 3]
    };
    
    const courseId = (searchParams?.get('courseId') ?? '').toString();
    if (!courseId) return [] as Word[];

    const words = await loadWordsFromCourse(courseId);
    return words.filter(word => 
      levelMap[difficulty].includes(word.level)
    );
  }, [difficulty, searchParams]);

  // 生成干扰项
  const generateDistractors = useCallback((correctAnswer: string, allWords: Word[], isChineseToEnglish: boolean) => {
    const otherWords = allWords.filter(w => 
      isChineseToEnglish ? w.term !== correctAnswer : w.meaning !== correctAnswer
    );
    
    const shuffled = otherWords.sort(() => Math.random() - 0.5);
    const distractors = shuffled.slice(0, 3).map(w => 
      isChineseToEnglish ? w.term : w.meaning
    );
    
    return [...distractors, correctAnswer].sort(() => Math.random() - 0.5);
  }, []);

  // 生成问题
  const generateQuestions = useCallback(async () => {
    const words = await getWordsByDifficulty();
    const shuffledWords = words.sort(() => Math.random() - 0.5);
    
    const newQuestions: Question[] = shuffledWords.map(word => {
      const isChineseToEnglish = Math.random() > 0.5;
      const correctAnswer = isChineseToEnglish ? word.term : word.meaning;
      const options = generateDistractors(correctAnswer, words, isChineseToEnglish);
      
      return {
        word,
        options,
        correctAnswer,
        type: isChineseToEnglish ? 'chinese-to-english' : 'english-to-chinese'
      };
    });
    
    return newQuestions;
  }, [difficulty, getWordsByDifficulty, generateDistractors]);

  // 开始游戏
  const startGame = async () => {
    const newQuestions = await generateQuestions();
    if (!newQuestions || newQuestions.length === 0) {
      setNoData(true);
      setGameState('menu');
      return;
    }
    setQuestions(newQuestions);
    setCurrentQuestion(newQuestions[0]);
    setGameState('playing');
    setQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setTotalQuestions(0);
    setTimeLeft(timeLimit);
    setStreakCount(0);
    setMaxStreak(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameStartTime(Date.now());
  };

  // 计时器
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameState, timeLeft]);

  // 回答问题
  const answerQuestion = (answer: string) => {
    if (!currentQuestion || selectedAnswer) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    setTotalQuestions(prev => prev + 1);
    
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setScore(prev => prev + 10 + streakCount * 2); // 连击奖励
      setStreakCount(prev => {
        const newStreak = prev + 1;
        setMaxStreak(current => Math.max(current, newStreak));
        return newStreak;
      });
    } else {
      setStreakCount(0);
    }
    
    // 2秒后显示下一题
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  // 下一题
  const nextQuestion = () => {
    const nextIndex = questionIndex + 1;
    
    if (nextIndex >= questions.length || timeLeft <= 0) {
      endGame();
      return;
    }
    
    setQuestionIndex(nextIndex);
    setCurrentQuestion(questions[nextIndex]);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  // 结束游戏
  const endGame = () => {
    setGameState('finished');
    
    const timeSpent = Math.round((Date.now() - gameStartTime) / 1000);
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    const results: GameResults = {
      score,
      totalQuestions,
      correctAnswers,
      accuracy,
      timeSpent,
      streakCount: maxStreak
    };
    
    if (onGameEnd) {
      onGameEnd(results);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = () => {
    if (streakCount >= 5) return 'text-yellow-400';
    if (streakCount >= 3) return 'text-orange-400';
    return 'text-blue-400';
  };

  // 游戏菜单
  if (gameState === 'menu') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-primary-400 mb-4">
              ⚡ Word Blitz
            </h1>
            <p className="text-gray-300 text-lg">
              快速词汇记忆挑战
            </p>
          </div>
          {noData && (
            <div className="mb-6 p-4 rounded bg-yellow-900/30 text-yellow-300">
              课程ID缺失或当前课程暂无可用词汇，请更换课程或稍后重试。
            </div>
          )}
          
          <div className="mb-8 space-y-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-white mb-2">游戏规则</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• 在{timeLimit}秒内回答尽可能多的词汇问题</li>
                <li>• 每答对一题得10分，连击有额外奖励</li>
                <li>• 支持中英文双向翻译</li>
                <li>• 连击越高，分数奖励越多</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="p-3 bg-green-900/30 rounded">
                <div className="text-green-400 font-bold">初级</div>
                <div className="text-gray-400">基础词汇</div>
              </div>
              <div className="p-3 bg-yellow-900/30 rounded">
                <div className="text-yellow-400 font-bold">中级</div>
                <div className="text-gray-400">进阶词汇</div>
              </div>
              <div className="p-3 bg-red-900/30 rounded">
                <div className="text-red-400 font-bold">高级</div>
                <div className="text-gray-400">高难度词汇</div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={startGame}
            className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
          >
            开始挑战
          </Button>
        </Card>
      </div>
    );
  }

  // 游戏进行中
  if (gameState === 'playing' && currentQuestion) {
    const progress = ((questionIndex + 1) / questions.length) * 100;
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        {/* 游戏状态栏 */}
        <div className="mb-6 grid grid-cols-4 gap-4 text-center">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className={`text-2xl font-bold ${getScoreColor()}`}>{score}</div>
            <div className="text-gray-400 text-sm">分数</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-400">{streakCount}</div>
            <div className="text-gray-400 text-sm">连击</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-400">{formatTime(timeLeft)}</div>
            <div className="text-gray-400 text-sm">时间</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-400">{questionIndex + 1}/{questions.length}</div>
            <div className="text-gray-400 text-sm">进度</div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        {/* 问题卡片 */}
        <Card className="p-8 mb-6">
          <div className="text-center mb-8">
            <div className="text-sm text-gray-400 mb-2">
              {currentQuestion.type === 'english-to-chinese' ? '选择正确的中文含义' : '选择正确的英文翻译'}
            </div>
            <div className="text-4xl font-bold text-white mb-4">
              {currentQuestion.type === 'english-to-chinese' 
                ? currentQuestion.word.term 
                : currentQuestion.word.meaning}
            </div>
            {streakCount > 0 && (
              <div className="text-orange-400 font-semibold flex items-center justify-center gap-1">
                <Flame className="w-4 h-4" /> 连击 {streakCount}
              </div>
            )}
          </div>

          {/* 选项 */}
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all ";
              
              if (selectedAnswer) {
                if (option === currentQuestion.correctAnswer) {
                  buttonClass += "border-green-500 bg-green-900/30 text-green-400";
                } else if (option === selectedAnswer && option !== currentQuestion.correctAnswer) {
                  buttonClass += "border-red-500 bg-red-900/30 text-red-400";
                } else {
                  buttonClass += "border-gray-600 bg-gray-700 text-gray-300";
                }
              } else {
                buttonClass += "border-gray-600 bg-gray-700 text-white hover:border-primary-500 hover:bg-primary-900/20";
              }

              return (
                <button
                  key={index}
                  className={buttonClass}
                  onClick={() => answerQuestion(option)}
                  disabled={!!selectedAnswer}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* 结果反馈 */}
          {showResult && (
            <div className="mt-6 text-center">
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <div className="text-green-400 font-semibold text-lg flex items-center justify-center gap-1">
                  <CheckCircle className="w-5 h-5" /> 正确！+{10 + (streakCount - 1) * 2}分
                </div>
              ) : (
                <div className="text-red-400 font-semibold text-lg flex items-center justify-center gap-1">
                  <XCircle className="w-5 h-5" /> 错误！正确答案是：{currentQuestion.correctAnswer}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // 游戏结束
  if (gameState === 'finished') {
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-primary-400 mb-2">
              <PartyPopper className="inline w-8 h-8 mr-2 align-[-0.2em]" /> 挑战完成！
            </h2>
            <p className="text-gray-300">
              恭喜你完成了Word Blitz挑战
            </p>
          </div>

          {/* 成绩统计 */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-primary-400">{score}</div>
              <div className="text-gray-400">总分</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400">{accuracy.toFixed(0)}%</div>
              <div className="text-gray-400">准确率</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-400">{maxStreak}</div>
              <div className="text-gray-400">最高连击</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-400">{correctAnswers}/{totalQuestions}</div>
              <div className="text-gray-400">正确题数</div>
            </div>
          </div>

          {/* 表现评价 */}
          <div className="mb-8 p-4 bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-white mb-2">表现评价</h3>
            <p className="text-gray-300">
              {accuracy >= 90 ? (
                <>
                  <Star className="w-4 h-4 text-yellow-400" /> 卓越表现！你的词汇掌握能力很强！
                </>
              ) : accuracy >= 70 ? (
                <>
                  <ThumbsUp className="w-4 h-4 text-green-400" /> 良好表现！继续保持练习！
                </>
              ) : accuracy >= 50 ? (
                <>
                  <Dumbbell className="w-4 h-4 text-purple-400" /> 不错的开始！多加练习会更好！
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 text-blue-400" /> 继续努力！建议先学习基础词汇。
                </>
              )}
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={startGame}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600"
            >
              再来一局
            </Button>
            <Button 
              onClick={() => setGameState('menu')}
              variant="secondary"
              className="w-full py-3"
            >
              返回菜单
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}