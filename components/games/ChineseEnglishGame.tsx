'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';

interface SpeakingExercise {
  id: string;
  chineseText: string;
  englishText: string;
  category: string;
  difficulty: number;
  keywords: string[];
  hints?: string[];
}

interface ChineseEnglishGameProps {
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: 'daily' | 'business' | 'travel' | 'academic';
  onGameEnd?: (results: GameResults) => void;
}

interface GameResults {
  score: number;
  totalExercises: number;
  completedExercises: number;
  averageAccuracy: number;
  totalSpeakingTime: number;
  improvementSuggestions: string[];
}

interface SpeechResult {
  transcript: string;
  confidence: number;
  accuracy: number;
  keywordMatch: number;
  feedback: string[];
}

// 示例练习数据
const SAMPLE_EXERCISES: SpeakingExercise[] = [
  {
    id: '1',
    chineseText: '你好，很高兴见到你',
    englishText: 'Hello, nice to meet you',
    category: 'daily',
    difficulty: 1,
    keywords: ['hello', 'nice', 'meet', 'you'],
    hints: ['打招呼的基本用语', '记住要用 "nice to meet you"']
  },
  {
    id: '2',
    chineseText: '请问洗手间在哪里？',
    englishText: 'Excuse me, where is the restroom?',
    category: 'daily',
    difficulty: 1,
    keywords: ['excuse', 'me', 'where', 'restroom'],
    hints: ['礼貌用语 "excuse me"', '"restroom" 或 "bathroom"']
  },
  {
    id: '3',
    chineseText: '我想预订一张明天的机票',
    englishText: 'I would like to book a flight ticket for tomorrow',
    category: 'travel',
    difficulty: 2,
    keywords: ['would', 'like', 'book', 'flight', 'ticket', 'tomorrow'],
    hints: ['使用 "would like" 更礼貌', '"book" 表示预订']
  },
  {
    id: '4',
    chineseText: '这个项目的截止日期是什么时候？',
    englishText: 'When is the deadline for this project?',
    category: 'business',
    difficulty: 2,
    keywords: ['when', 'deadline', 'project'],
    hints: ['"deadline" 表示截止日期', '注意时态和语序']
  },
  {
    id: '5',
    chineseText: '我认为我们需要重新考虑这个策略',
    englishText: 'I think we need to reconsider this strategy',
    category: 'business',
    difficulty: 3,
    keywords: ['think', 'need', 'reconsider', 'strategy'],
    hints: ['"reconsider" 表示重新考虑', '表达个人观点用 "I think"']
  }
];

export default function ChineseEnglishGame({ 
  difficulty = 'beginner', 
  category = 'daily',
  onGameEnd 
}: ChineseEnglishGameProps) {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'recording' | 'analyzing' | 'finished'>('menu');
  const [currentExercise, setCurrentExercise] = useState<SpeakingExercise | null>(null);
  const [exercises, setExercises] = useState<SpeakingExercise[]>([]);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [completedExercises, setCompletedExercises] = useState(0);
  const [totalAccuracy, setTotalAccuracy] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [speechResult, setSpeechResult] = useState<SpeechResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [totalSpeakingTime, setTotalSpeakingTime] = useState(0);
  const [currentRecordingTime, setCurrentRecordingTime] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number>(0);

  // 语音识别相关
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // 初始化语音识别
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // 根据难度和类别筛选练习
  const getExercisesByFilter = useCallback(() => {
    const levelMap = {
      'beginner': [1],
      'intermediate': [1, 2],
      'advanced': [2, 3]
    };
    
    return SAMPLE_EXERCISES.filter(exercise => 
      levelMap[difficulty].includes(exercise.difficulty) &&
      (category === 'daily' || exercise.category === category)
    );
  }, [difficulty, category]);

  // 开始游戏
  const startGame = () => {
    const filteredExercises = getExercisesByFilter();
    const shuffledExercises = filteredExercises.sort(() => Math.random() - 0.5);
    
    setExercises(shuffledExercises);
    setCurrentExercise(shuffledExercises[0]);
    setGameState('playing');
    setExerciseIndex(0);
    setScore(0);
    setCompletedExercises(0);
    setTotalAccuracy(0);
    setSpeechResult(null);
    setShowHints(false);
    setAudioURL(null);
    setTotalSpeakingTime(0);
    setGameStartTime(Date.now());
  };

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      
      // 创建MediaRecorder用于录音
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      audioChunks.current = [];
      
      recorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
      };
      
      // 开始语音识别和录音
      if (recognition) {
        recognition.start();
        
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          const confidence = event.results[0][0].confidence;
          
          analyzeSpeech(transcript, confidence);
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          stopRecording();
        };
      }
      
      recorder.start();
      setIsRecording(true);
      setGameState('recording');
      setCurrentRecordingTime(0);
      
      // 录音计时器
      recordingTimer.current = setInterval(() => {
        setCurrentRecordingTime(prev => prev + 1);
      }, 1000);
      
      // 30秒后自动停止录音
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 30000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  // 停止录音
  const stopRecording = () => {
    setIsRecording(false);
    setGameState('analyzing');
    
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }
    
    if (recognition) {
      recognition.stop();
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
    }
    
    setTotalSpeakingTime(prev => prev + currentRecordingTime);
  };

  // 分析语音
  const analyzeSpeech = (transcript: string, confidence: number) => {
    if (!currentExercise) return;
    
    const targetText = currentExercise.englishText.toLowerCase();
    const spokenText = transcript.toLowerCase();
    
    // 计算关键词匹配度
    const keywords = currentExercise.keywords.map(k => k.toLowerCase());
    const spokenWords = spokenText.split(' ');
    const matchedKeywords = keywords.filter(keyword => 
      spokenWords.some(word => word.includes(keyword) || keyword.includes(word))
    );
    const keywordMatch = (matchedKeywords.length / keywords.length) * 100;
    
    // 计算整体准确度
    const accuracy = calculateTextSimilarity(spokenText, targetText);
    
    // 生成反馈
    const feedback: string[] = [];
    
    if (confidence < 0.5) {
      feedback.push('🔊 建议说话更清晰一些');
    }
    
    if (keywordMatch < 50) {
      feedback.push('📝 注意包含关键词: ' + keywords.join(', '));
    }
    
    if (accuracy < 60) {
      feedback.push('🎯 尝试更准确地表达句子含义');
    } else if (accuracy >= 80) {
      feedback.push('🌟 表达很准确！');
    }
    
    if (spokenWords.length < keywords.length) {
      feedback.push('💬 句子可能太短了，尝试完整表达');
    }
    
    const result: SpeechResult = {
      transcript,
      confidence: confidence * 100,
      accuracy,
      keywordMatch,
      feedback
    };
    
    setSpeechResult(result);
    
    // 更新统计
    setCompletedExercises(prev => prev + 1);
    setTotalAccuracy(prev => prev + accuracy);
    
    const earnedScore = Math.round(accuracy * (confidence + 0.5) * currentExercise.difficulty);
    setScore(prev => prev + earnedScore);
    
    // 3秒后显示下一题
    setTimeout(() => {
      nextExercise();
    }, 3000);
  };

  // 文本相似度计算（简化版）
  const calculateTextSimilarity = (text1: string, text2: string): number => {
    const words1 = text1.split(' ').filter(w => w.length > 0);
    const words2 = text2.split(' ').filter(w => w.length > 0);
    
    let matches = 0;
    const maxLength = Math.max(words1.length, words2.length);
    
    words1.forEach(word1 => {
      const found = words2.find(word2 => 
        word1 === word2 || 
        word1.includes(word2) || 
        word2.includes(word1) ||
        levenshteinDistance(word1, word2) <= 1
      );
      if (found) matches++;
    });
    
    return Math.min(100, (matches / maxLength) * 100);
  };

  // 编辑距离算法
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // 下一题
  const nextExercise = () => {
    const nextIndex = exerciseIndex + 1;
    
    if (nextIndex >= exercises.length) {
      endGame();
      return;
    }
    
    setExerciseIndex(nextIndex);
    setCurrentExercise(exercises[nextIndex]);
    setSpeechResult(null);
    setShowHints(false);
    setAudioURL(null);
    setGameState('playing');
    setCurrentRecordingTime(0);
  };

  // 结束游戏
  const endGame = () => {
    setGameState('finished');
    
    const averageAccuracy = completedExercises > 0 ? totalAccuracy / completedExercises : 0;
    const improvementSuggestions: string[] = [];
    
    if (averageAccuracy < 60) {
      improvementSuggestions.push('建议多练习基础发音和词汇');
      improvementSuggestions.push('可以先听标准发音再模仿');
    } else if (averageAccuracy < 80) {
      improvementSuggestions.push('继续练习语调和语速');
      improvementSuggestions.push('注意句子的完整性');
    } else {
      improvementSuggestions.push('表现优秀！可以挑战更高难度');
    }
    
    if (totalSpeakingTime < 60) {
      improvementSuggestions.push('建议延长练习时间以提高流利度');
    }
    
    const results: GameResults = {
      score,
      totalExercises: exercises.length,
      completedExercises,
      averageAccuracy,
      totalSpeakingTime,
      improvementSuggestions
    };
    
    onGameEnd?.(results);
  };

  // 播放标准发音
  const playStandardAudio = () => {
    if (!currentExercise) return;
    
    const utterance = new SpeechSynthesisUtterance(currentExercise.englishText);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // 重新录音
  const retryRecording = () => {
    setSpeechResult(null);
    setAudioURL(null);
    setGameState('playing');
  };

  // 游戏菜单
  if (gameState === 'menu') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-primary-400 mb-4">
              🎤 Chinese-English
            </h1>
            <p className="text-gray-300 text-lg">
              中英文对照口语练习
            </p>
          </div>
          
          <div className="mb-8 space-y-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-white mb-2">练习说明</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• 看中文提示，用英文表达出来</li>
                <li>• 系统会实时识别并评分你的发音</li>
                <li>• 根据准确度和关键词匹配获得分数</li>
                <li>• 可以听标准发音并重新录制</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-800 rounded">
                <h4 className="text-primary-400 font-bold mb-2">评分标准</h4>
                <div className="text-gray-400 text-xs space-y-1">
                  <div>• 发音准确度 (40%)</div>
                  <div>• 关键词匹配 (30%)</div>
                  <div>• 语音清晰度 (20%)</div>
                  <div>• 完整性 (10%)</div>
                </div>
              </div>
              <div className="p-3 bg-gray-800 rounded">
                <h4 className="text-primary-400 font-bold mb-2">练习分类</h4>
                <div className="text-gray-400 text-xs space-y-1">
                  <div>• 日常对话</div>
                  <div>• 商务英语</div>
                  <div>• 旅行英语</div>
                  <div>• 学术英语</div>
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
  if ((gameState === 'playing' || gameState === 'recording' || gameState === 'analyzing') && currentExercise) {
    const progress = ((exerciseIndex + 1) / exercises.length) * 100;
    
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* 游戏状态栏 */}
        <div className="mb-6 grid grid-cols-4 gap-4 text-center">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-400">{score}</div>
            <div className="text-gray-400 text-sm">分数</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-400">{completedExercises}/{exercises.length}</div>
            <div className="text-gray-400 text-sm">进度</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-400">
              {completedExercises > 0 ? Math.round(totalAccuracy / completedExercises) : 0}%
            </div>
            <div className="text-gray-400 text-sm">平均准确度</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-400">{Math.round(totalSpeakingTime / 60)}分</div>
            <div className="text-gray-400 text-sm">练习时长</div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        {/* 练习内容 */}
        <Card className="p-8 mb-6">
          <div className="text-center mb-6">
            <div className="text-sm text-gray-400 mb-2">请用英文表达以下中文</div>
            <div className="text-3xl font-bold text-white mb-4">
              {currentExercise.chineseText}
            </div>
            
            {/* 类别和难度标签 */}
            <div className="flex gap-2 justify-center mb-4">
              <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm">
                {currentExercise.category}
              </span>
              <span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-sm">
                难度 {currentExercise.difficulty}
              </span>
            </div>

            {/* 标准答案（可选显示） */}
            <div className="text-lg text-gray-300 mb-6">
              标准表达: {currentExercise.englishText}
            </div>
          </div>

          {/* 录音状态 */}
          {gameState === 'recording' && (
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <div className="text-white text-3xl">🎤</div>
              </div>
              <div className="text-red-400 font-semibold text-lg">
                录音中... {currentRecordingTime}s
              </div>
              <div className="text-gray-400 text-sm mt-2">
                请清晰地说出英文表达
              </div>
            </div>
          )}

          {/* 分析状态 */}
          {gameState === 'analyzing' && (
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="loading-spinner"></div>
              </div>
              <div className="text-blue-400 font-semibold text-lg">
                正在分析语音...
              </div>
            </div>
          )}

          {/* 控制按钮 */}
          <div className="flex gap-4 justify-center">
            {gameState === 'playing' && (
              <>
                <Button
                  onClick={startRecording}
                  className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  🎤 开始录音
                </Button>
                <Button
                  onClick={playStandardAudio}
                  variant="outline"
                  className="px-6 py-4"
                >
                  🔊 听标准发音
                </Button>
                <Button
                  onClick={() => setShowHints(!showHints)}
                  variant="outline"
                  className="px-6 py-4"
                >
                  💡 {showHints ? '隐藏' : '显示'}提示
                </Button>
              </>
            )}
            
            {gameState === 'recording' && (
              <Button
                onClick={stopRecording}
                className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700"
              >
                ⏹️ 停止录音
              </Button>
            )}
          </div>

          {/* 提示内容 */}
          {showHints && currentExercise.hints && (
            <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <h4 className="text-yellow-400 font-semibold mb-2">💡 提示</h4>
              <ul className="text-yellow-300 text-sm space-y-1">
                {currentExercise.hints.map((hint, index) => (
                  <li key={index}>• {hint}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* 语音分析结果 */}
        {speechResult && (
          <Card className="p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">📊 语音分析结果</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-800 rounded">
                <div className="text-2xl font-bold text-green-400">{speechResult.accuracy.toFixed(0)}%</div>
                <div className="text-gray-400 text-sm">准确度</div>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded">
                <div className="text-2xl font-bold text-blue-400">{speechResult.confidence.toFixed(0)}%</div>
                <div className="text-gray-400 text-sm">置信度</div>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded">
                <div className="text-2xl font-bold text-purple-400">{speechResult.keywordMatch.toFixed(0)}%</div>
                <div className="text-gray-400 text-sm">关键词匹配</div>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded">
                <div className="text-2xl font-bold text-orange-400">{currentRecordingTime}s</div>
                <div className="text-gray-400 text-sm">录音时长</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-gray-300 font-semibold mb-2">🎯 你的表达</h4>
                <div className="p-3 bg-gray-800 rounded text-white">
                  "{speechResult.transcript}"
                </div>
              </div>

              <div>
                <h4 className="text-gray-300 font-semibold mb-2">✨ 改进建议</h4>
                <ul className="space-y-1">
                  {speechResult.feedback.map((item, index) => (
                    <li key={index} className="text-gray-300 text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 录音回放 */}
              {audioURL && (
                <div>
                  <h4 className="text-gray-300 font-semibold mb-2">🔊 录音回放</h4>
                  <audio controls src={audioURL} className="w-full">
                    您的浏览器不支持音频播放。
                  </audio>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={retryRecording}
                  variant="outline"
                  className="px-6 py-2"
                >
                  🔄 重新录音
                </Button>
                <Button
                  onClick={nextExercise}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600"
                >
                  ➡️ 下一题
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // 游戏结束
  if (gameState === 'finished') {
    const averageAccuracy = completedExercises > 0 ? totalAccuracy / completedExercises : 0;
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-primary-400 mb-2">
              🏆 练习完成！
            </h2>
            <p className="text-gray-300">
              恭喜你完成了口语练习
            </p>
          </div>

          {/* 成绩统计 */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-primary-400">{score}</div>
              <div className="text-gray-400">总分</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400">{averageAccuracy.toFixed(0)}%</div>
              <div className="text-gray-400">平均准确度</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-400">{Math.round(totalSpeakingTime / 60)}</div>
              <div className="text-gray-400">练习分钟数</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-400">{completedExercises}/{exercises.length}</div>
              <div className="text-gray-400">完成题数</div>
            </div>
          </div>

          {/* 改进建议 */}
          <div className="mb-8 p-4 bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-white mb-3">📈 改进建议</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              {onGameEnd && (
                <>
                  {averageAccuracy >= 80 ? (
                    <li>🌟 口语表达很棒！可以尝试更高难度的练习</li>
                  ) : averageAccuracy >= 60 ? (
                    <li>👍 表现不错！继续练习提高准确度</li>
                  ) : (
                    <li>💪 多听多练，重点关注发音准确性</li>
                  )}
                  
                  {totalSpeakingTime < 300 && (
                    <li>⏰ 建议增加练习时间，提高口语流利度</li>
                  )}
                  
                  <li>🎯 每天坚持练习15-30分钟，效果最佳</li>
                </>
              )}
            </ul>
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
              variant="outline"
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