'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult 
} from '@hello-pangea/dnd';
import { 
  Lightbulb, 
  PartyPopper, 
  XCircle, 
  Trophy, 
  Star, 
  ThumbsUp, 
  Dumbbell, 
  BookOpen 
} from 'lucide-react';

interface Word {
  id: string;
  text: string;
  type: 'noun' | 'verb' | 'adjective' | 'preposition' | 'article' | 'pronoun' | 'adverb';
}

interface SentenceData {
  id: string;
  chineseText: string;
  englishText: string;
  words: Word[];
  correctOrder: string[];
  difficulty: number;
  grammarPoints: string[];
  hint?: string;
}

interface SentenceBuilderGameProps {
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  onGameEnd?: (results: GameResults) => void;
}

interface GameResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeSpent: number;
  averageTime: number;
}

// 从packages数据加载句子
let cachedSentences: SentenceData[] = [];
let currentCourseId: string | null = null;

// 从课程数据生成句子数据
async function loadSentencesFromCourse(courseId: string = '01'): Promise<SentenceData[]> {
  try {
    // 如果已经缓存了相同课程的数据，直接返回
    if (currentCourseId === courseId && cachedSentences.length > 0) {
      return cachedSentences;
    }

    const response = await fetch(`/api/courses/${courseId.padStart(2, '0')}`);
    if (!response.ok) {
      throw new Error('Failed to load course data');
    }

    const courseItems = await response.json();
    
    // 筛选出适合句子构建的数据（完整句子，不超过10个单词）
    const sentenceItems = courseItems.filter((item: any) => {
      const wordCount = item.english.split(' ').length;
      return wordCount >= 3 && wordCount <= 10 && item.english.includes(' ');
    });

    const sentences: SentenceData[] = sentenceItems.map((item: any, index: number) => {
      const words = item.english.split(' ');
      const wordObjects: Word[] = words.map((word: string, wordIndex: number) => ({
        id: `word-${index}-${wordIndex}`,
        text: word,
        type: determineWordType(word, wordIndex, words.length)
      }));
      
      const correctOrder = wordObjects.map(w => w.id);
      const difficulty = determineSentenceDifficulty(item.english, item.chinese);
      
      return {
        id: `sentence-${index + 1}`,
        chineseText: item.chinese,
        englishText: item.english,
        words: wordObjects,
        correctOrder,
        difficulty,
        grammarPoints: generateGrammarPoints(item.english),
        hint: generateHint(item.english, item.chinese)
      };
    });

    // 缓存数据
    cachedSentences = sentences;
    currentCourseId = courseId;
    
    return sentences;
  } catch (error) {
    console.error('Error loading sentences from course:', error);
    // 返回基础句子作为后备
    return [
      {
        id: '1',
        chineseText: '我喜欢苹果',
        englishText: 'I like apples',
        words: [
          { id: 'word-1', text: 'I', type: 'pronoun' },
          { id: 'word-2', text: 'like', type: 'verb' },
          { id: 'word-3', text: 'apples', type: 'noun' }
        ],
        correctOrder: ['word-1', 'word-2', 'word-3'],
        difficulty: 1,
        grammarPoints: ['主谓宾结构'],
        hint: '主语 + 动词 + 宾语'
      }
    ];
  }
}

// 确定单词类型
function determineWordType(word: string, position: number, totalWords: number): Word['type'] {
  const lowerWord = word.toLowerCase();
  
  // 代词
  if (['i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that'].includes(lowerWord)) {
    return 'pronoun';
  }
  
  // 冠词
  if (['a', 'an', 'the'].includes(lowerWord)) {
    return 'article';
  }
  
  // 介词
  if (['in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'of', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once'].includes(lowerWord)) {
    return 'preposition';
  }
  
  // 动词（常见动词和位置判断）
  if (['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'like', 'love', 'want', 'need', 'go', 'come', 'get', 'make', 'take', 'give', 'see', 'know', 'think', 'feel', 'work', 'play', 'study', 'learn'].includes(lowerWord) || 
      (position === 1 && totalWords > 2)) {
    return 'verb';
  }
  
  // 副词（以-ly结尾或常见副词）
  if (word.endsWith('ly') || ['very', 'really', 'quite', 'always', 'never', 'often', 'sometimes', 'usually', 'today', 'tomorrow', 'yesterday', 'now', 'then', 'here', 'there'].includes(lowerWord)) {
    return 'adverb';
  }
  
  // 形容词（常见形容词或位置判断）
  if (['good', 'bad', 'big', 'small', 'new', 'old', 'young', 'beautiful', 'nice', 'great', 'important', 'interesting', 'difficult', 'easy', 'happy', 'sad', 'some', 'many', 'much', 'few', 'little'].includes(lowerWord)) {
    return 'adjective';
  }
  
  // 默认为名词
  return 'noun';
}

// 确定句子难度
function determineSentenceDifficulty(english: string, chinese: string): number {
  const wordCount = english.split(' ').length;
  const hasComplexWords = english.split(' ').some(word => word.length > 6);
  
  if (wordCount <= 4 && !hasComplexWords) {
    return 1; // 简单
  } else if (wordCount <= 7) {
    return 2; // 中等
  } else {
    return 3; // 困难
  }
}

// 生成语法要点
function generateGrammarPoints(english: string): string[] {
  const points: string[] = [];
  const lowerEnglish = english.toLowerCase();
  
  if (lowerEnglish.includes(' is ') || lowerEnglish.includes(' are ') || lowerEnglish.includes(' am ')) {
    points.push('be动词');
  }
  if (lowerEnglish.includes(' the ')) {
    points.push('定冠词');
  }
  if (lowerEnglish.includes(' a ') || lowerEnglish.includes(' an ')) {
    points.push('不定冠词');
  }
  if (lowerEnglish.includes(' in ') || lowerEnglish.includes(' on ') || lowerEnglish.includes(' at ')) {
    points.push('介词短语');
  }
  
  return points.length > 0 ? points : ['基础语法'];
}

// 生成提示
function generateHint(english: string, chinese: string): string {
  const wordCount = english.split(' ').length;
  
  if (wordCount <= 3) {
    return '简单句：主语 + 动词 + 宾语';
  } else if (wordCount <= 5) {
    return '注意词序和语法结构';
  } else {
    return '复杂句：注意从句和修饰语的位置';
  }
}

export default function SentenceBuilderGame({ 
  difficulty = 'beginner', 
  onGameEnd 
}: SentenceBuilderGameProps) {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  const [currentSentence, setCurrentSentence] = useState<SentenceData | null>(null);
  const [sentences, setSentences] = useState<SentenceData[]>([]);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [userOrder, setUserOrder] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<Word[]>([]);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);

  // 根据难度筛选句子
  const getSentencesByDifficulty = useCallback(async () => {
    const levelMap = {
      'beginner': [1],
      'intermediate': [1, 2],
      'advanced': [2, 3]
    };
    
    const allSentences = await loadSentencesFromCourse('01');
    return allSentences.filter(sentence => 
      levelMap[difficulty].includes(sentence.difficulty)
    );
  }, [difficulty]);

  // 开始游戏
  const startGame = async () => {
    const filteredSentences = await getSentencesByDifficulty();
    const shuffledSentences = filteredSentences.sort(() => Math.random() - 0.5);
    
    setSentences(shuffledSentences);
    setCurrentSentence(shuffledSentences[0]);
    setGameState('playing');
    setSentenceIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setTotalQuestions(0);
    setShowResult(false);
    setShowHint(false);
    setHintsUsed(0);
    setGameStartTime(Date.now());
    setTotalTimeSpent(0);
    
    // 初始化第一个句子
    if (shuffledSentences[0]) {
      initializeSentence(shuffledSentences[0]);
    }
  };

  // 初始化句子
  const initializeSentence = (sentence: SentenceData) => {
    const shuffledWords = [...sentence.words].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffledWords);
    setUserOrder([]);
    setShowResult(false);
    setShowHint(false);
    setQuestionStartTime(Date.now());
  };

  // 处理拖拽结束
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === 'available-words' && destination.droppableId === 'sentence-builder') {
      // 从词汇池拖到句子构建区
      const word = availableWords.find(w => w.id === draggableId);
      if (!word) return;

      setAvailableWords(prev => prev.filter(w => w.id !== draggableId));
      
      const newUserOrder = [...userOrder];
      newUserOrder.splice(destination.index, 0, draggableId);
      setUserOrder(newUserOrder);
      
    } else if (source.droppableId === 'sentence-builder' && destination.droppableId === 'available-words') {
      // 从句子构建区拖回词汇池
      const word = currentSentence?.words.find(w => w.id === draggableId);
      if (!word) return;

      setUserOrder(prev => prev.filter(id => id !== draggableId));
      setAvailableWords(prev => [...prev, word]);
      
    } else if (source.droppableId === 'sentence-builder' && destination.droppableId === 'sentence-builder') {
      // 在句子构建区内重新排序
      const newUserOrder = [...userOrder];
      const [movedItem] = newUserOrder.splice(source.index, 1);
      newUserOrder.splice(destination.index, 0, movedItem);
      setUserOrder(newUserOrder);
    }
  };

  // 检查答案
  const checkAnswer = () => {
    if (!currentSentence || userOrder.length !== currentSentence.correctOrder.length) {
      return;
    }

    const isCorrect = JSON.stringify(userOrder) === JSON.stringify(currentSentence.correctOrder);
    const timeSpent = Date.now() - questionStartTime;
    
    setTotalQuestions(prev => prev + 1);
    setShowResult(true);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      const baseScore = currentSentence.difficulty * 20;
      const timeBonus = Math.max(0, 30 - Math.floor(timeSpent / 1000)) * 2;
      const hintPenalty = hintsUsed * 5;
      const finalScore = Math.max(10, baseScore + timeBonus - hintPenalty);
      setScore(prev => prev + finalScore);
    }
    
    setTotalTimeSpent(prev => prev + timeSpent);
    
    // 2.5秒后显示下一题
    setTimeout(() => {
      nextSentence();
    }, 2500);
  };

  // 下一题
  const nextSentence = () => {
    const nextIndex = sentenceIndex + 1;
    
    if (nextIndex >= sentences.length) {
      endGame();
      return;
    }
    
    setSentenceIndex(nextIndex);
    setCurrentSentence(sentences[nextIndex]);
    setHintsUsed(0);
    initializeSentence(sentences[nextIndex]);
  };

  // 结束游戏
  const endGame = () => {
    setGameState('finished');
    
    const totalGameTime = Date.now() - gameStartTime;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const averageTime = totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;
    
    const results: GameResults = {
      score,
      totalQuestions,
      correctAnswers,
      accuracy,
      timeSpent: Math.round(totalGameTime / 1000),
      averageTime: Math.round(averageTime / 1000)
    };
    
    onGameEnd?.(results);
  };

  // 显示提示
  const toggleHint = () => {
    if (!showHint) {
      setHintsUsed(prev => prev + 1);
    }
    setShowHint(!showHint);
  };

  // 重置当前句子
  const resetSentence = () => {
    if (currentSentence) {
      initializeSentence(currentSentence);
      setHintsUsed(0);
    }
  };

  // 获取词汇类型颜色
  const getWordTypeColor = (type: string) => {
    const colorMap = {
      'noun': 'bg-blue-500',
      'verb': 'bg-green-500',
      'adjective': 'bg-yellow-500',
      'preposition': 'bg-purple-500',
      'article': 'bg-red-500',
      'pronoun': 'bg-pink-500',
      'adverb': 'bg-orange-500'
    };
    return colorMap[type as keyof typeof colorMap] || 'bg-gray-500';
  };

  // 获取词汇类型中文名
  const getWordTypeName = (type: string) => {
    const nameMap = {
      'noun': '名词',
      'verb': '动词',
      'adjective': '形容词',
      'preposition': '介词',
      'article': '冠词',
      'pronoun': '代词',
      'adverb': '副词'
    };
    return nameMap[type as keyof typeof nameMap] || type;
  };

  // 游戏菜单
  if (gameState === 'menu') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-primary-400 mb-4">
              🔧 Sentence Builder
            </h1>
            <p className="text-gray-300 text-lg">
              通过拖拽组句练习英语语法
            </p>
          </div>
          
          <div className="mb-8 space-y-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-white mb-2">游戏规则</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• 看中文句子，拖拽英文单词组成正确的英文句子</li>
                <li>• 根据句子难度和完成时间获得分数</li>
                <li>• 使用提示会扣除部分分数</li>
                <li>• 完成所有句子后查看总成绩</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-800 rounded">
                <h4 className="text-primary-400 font-bold mb-2">词汇类型标识</h4>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 rounded text-xs bg-blue-500">名词</span>
                  <span className="px-2 py-1 rounded text-xs bg-green-500">动词</span>
                  <span className="px-2 py-1 rounded text-xs bg-yellow-500">形容词</span>
                  <span className="px-2 py-1 rounded text-xs bg-purple-500">介词</span>
                </div>
              </div>
              <div className="p-3 bg-gray-800 rounded">
                <h4 className="text-primary-400 font-bold mb-2">评分规则</h4>
                <div className="text-gray-400 text-xs">
                  <div>基础分数：难度 × 20</div>
                  <div>时间奖励：最高60分</div>
                  <div>提示扣分：每次-5分</div>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={startGame}
            className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
          >
            开始练习
          </Button>
        </Card>
      </div>
    );
  }

  // 游戏进行中
  if (gameState === 'playing' && currentSentence) {
    const progress = ((sentenceIndex + 1) / sentences.length) * 100;
    const isComplete = userOrder.length === currentSentence.correctOrder.length;
    const userSentence = userOrder.map(id => 
      currentSentence.words.find(w => w.id === id)?.text
    ).join(' ');
    
    return (
      <div className="max-w-6xl mx-auto p-6">
        {/* 游戏状态栏 */}
        <div className="mb-6 grid grid-cols-4 gap-4 text-center">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-400">{score}</div>
            <div className="text-gray-400 text-sm">分数</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-400">{correctAnswers}/{totalQuestions}</div>
            <div className="text-gray-400 text-sm">正确题数</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-400">{sentenceIndex + 1}/{sentences.length}</div>
            <div className="text-gray-400 text-sm">进度</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-400">{hintsUsed}</div>
            <div className="text-gray-400 text-sm">提示使用</div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        {/* 中文句子提示 */}
        <Card className="p-6 mb-6 text-center">
          <div className="text-sm text-gray-400 mb-2">请将下面的中文句子翻译成英文</div>
          <div className="text-2xl font-bold text-white mb-4">
            {currentSentence.chineseText}
          </div>
          
          {/* 语法点提示 */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {currentSentence.grammarPoints.map((point, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-primary-900/30 text-primary-400 rounded-full text-sm"
              >
                {point}
              </span>
            ))}
          </div>

          {/* 提示按钮 */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={toggleHint}
              variant="secondary"
              className="text-sm"
            >
              {showHint ? '隐藏提示' : '显示提示'} ({hintsUsed})
            </Button>
            <Button
              onClick={resetSentence}
              variant="secondary"
              className="text-sm"
            >
              重置
            </Button>
          </div>

          {/* 提示内容 */}
          {showHint && currentSentence.hint && (
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <div className="text-yellow-400 text-sm">
                <Lightbulb className="inline w-4 h-4 mr-1" /> 语法提示: {currentSentence.hint}
              </div>
            </div>
          )}
        </Card>

        <DragDropContext onDragEnd={handleDragEnd}>
          {/* 句子构建区 */}
          <Card className="p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">构建你的句子</h3>
              <div className="text-sm text-gray-400">拖拽下方单词到这里组成句子</div>
            </div>
            
            <Droppable droppableId="sentence-builder" direction="horizontal">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[80px] p-4 border-2 border-dashed rounded-lg transition-colors ${
                    snapshot.isDraggingOver
                      ? 'border-primary-500 bg-primary-900/20'
                      : 'border-gray-600 bg-gray-800'
                  }`}
                >
                  <div className="flex flex-wrap gap-2">
                    {userOrder.map((wordId, index) => {
                      const word = currentSentence.words.find(w => w.id === wordId);
                      if (!word) return null;
                      
                      return (
                        <Draggable key={wordId} draggableId={wordId} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`px-3 py-2 rounded-lg border-2 font-medium select-none transition-all ${
                                snapshot.isDragging
                                  ? 'shadow-lg rotate-2 scale-105'
                                  : ''
                              } ${getWordTypeColor(word.type)} text-white border-transparent hover:border-white/30`}
                            >
                              {word.text}
                              <div className="text-xs opacity-70 mt-1">
                                {getWordTypeName(word.type)}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                  
                  {/* 用户构建的句子预览 */}
                  {userSentence && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="text-gray-400 text-sm mb-1">当前句子:</div>
                      <div className="text-white font-medium">{userSentence}</div>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
            
            {/* 检查答案按钮 */}
            <div className="mt-4 text-center">
              <Button
                onClick={checkAnswer}
                disabled={!isComplete}
                className={`px-8 py-3 ${
                  isComplete
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                检查答案 {isComplete ? '✓' : `(${userOrder.length}/${currentSentence.correctOrder.length})`}
              </Button>
            </div>
          </Card>

          {/* 词汇池 */}
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">可用单词</h3>
              <div className="text-sm text-gray-400">拖拽单词到上方构建句子</div>
            </div>
            
            <Droppable droppableId="available-words" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-h-[80px] p-4 bg-gray-800 rounded-lg"
                >
                  <div className="flex flex-wrap gap-2">
                    {availableWords.map((word, index) => (
                      <Draggable key={word.id} draggableId={word.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`px-3 py-2 rounded-lg border-2 font-medium select-none cursor-move transition-all ${
                              snapshot.isDragging
                                ? 'shadow-lg rotate-2 scale-105'
                                : 'hover:scale-105'
                            } ${getWordTypeColor(word.type)} text-white border-transparent hover:border-white/30`}
                          >
                            {word.text}
                            <div className="text-xs opacity-70 mt-1">
                              {getWordTypeName(word.type)}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </Card>
        </DragDropContext>

        {/* 结果反馈 */}
        {showResult && (
          <div className="mt-6">
            <Card className={`p-6 text-center ${
              JSON.stringify(userOrder) === JSON.stringify(currentSentence.correctOrder)
                ? 'border-green-500 bg-green-900/20'
                : 'border-red-500 bg-red-900/20'
            }`}>
              {JSON.stringify(userOrder) === JSON.stringify(currentSentence.correctOrder) ? (
                <div className="text-green-400">
                  <div className="text-2xl mb-2"><PartyPopper className="inline w-6 h-6 mr-2 align-[-0.2em]" /> 正确！</div>
                  <div className="font-semibold">你的答案: {userSentence}</div>
                </div>
              ) : (
                <div className="text-red-400">
                  <div className="text-2xl mb-2"><XCircle className="inline w-6 h-6 mr-2 align-[-0.2em]" /> 错误！</div>
                  <div className="space-y-2">
                    <div>你的答案: {userSentence}</div>
                    <div>正确答案: {currentSentence.englishText}</div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
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
              <Trophy className="inline w-8 h-8 mr-2 align-[-0.2em]" /> 练习完成！
            </h2>
            <p className="text-gray-300">
              恭喜你完成了Sentence Builder练习
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
              <div className="text-3xl font-bold text-purple-400">{Math.round(totalTimeSpent / totalQuestions / 1000)}s</div>
              <div className="text-gray-400">平均用时</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-400">{correctAnswers}/{totalQuestions}</div>
              <div className="text-gray-400">正确题数</div>
            </div>
          </div>

          {/* 表现评价 */}
          <div className="mb-8 p-4 bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-white mb-2">语法掌握评价</h3>
            <p className="text-gray-300">
              {accuracy >= 90 ? (
                <>
                  <Star className="w-4 h-4 text-yellow-400" /> 语法掌握优秀！你对英语句子结构有很好的理解！
                </>
              ) : accuracy >= 70 ? (
                <>
                  <ThumbsUp className="w-4 h-4 text-green-400" /> 语法掌握良好！多练习复杂句型会更好！
                </>
              ) : accuracy >= 50 ? (
                <>
                  <Dumbbell className="w-4 h-4 text-purple-400" /> 语法基础可以！建议加强语法规则学习！
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 text-blue-400" /> 需要加强语法基础！建议从简单句型开始练习。
                </>
              )}
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={startGame}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600"
            >
              再来一轮
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