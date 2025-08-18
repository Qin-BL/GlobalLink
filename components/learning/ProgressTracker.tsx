'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';
import {
  TrendingUp,
  Target,
  Calendar,
  Clock,
  Award,
  BookOpen,
  MessageCircle,
  Zap,
  Brain,
  Star
} from 'lucide-react';

interface ProgressData {
  overview: {
    totalWords: number;
    totalSentences: number;
    wordsNeedReview: number;
    sentencesNeedReview: number;
    masteryDistribution: {
      beginner: number;
      elementary: number;
      intermediate: number;
      advanced: number;
    };
    sm2Stats: {
      total: number;
      dueForReview: number;
      mastered: number;
      masteryRate: number;
      avgEaseFactor: number;
      avgInterval: number;
    };
    streakDays: number;
    totalStudyTime: number;
    totalSessions: number;
  };
  trends: {
    daily: Array<{
      date: string;
      sessions: number;
      totalTime: number;
      score: number;
      accuracy: number;
    }>;
    recentSessions: Array<{
      gameType: string;
      score: number;
      accuracy: number;
      timeSpent: number;
      date: string;
    }>;
  };
  recommendations: {
    priorityWords: Array<{
      word: any;
      priority: number;
      daysSinceReview: number;
    }>;
    prioritySentences: Array<{
      sentence: any;
      masteryLevel: number;
      daysSinceReview: number;
    }>;
  };
}

interface ProgressTrackerProps {
  userId: string;
  onDataUpdate?: (data: ProgressData) => void;
}

export default function ProgressTracker({ userId, onDataUpdate }: ProgressTrackerProps) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'words' | 'sentences' | 'recommendations'>('overview');

  // 加载进度数据
  const loadProgressData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/learning/analysis?userId=${userId}&type=${activeTab}`);
      const progressData = await response.json();
      
      setData(progressData);
      onDataUpdate?.(progressData);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadProgressData();
    }
  }, [userId, activeTab]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-2 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-2 bg-gray-700 rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-6 text-center">
        <div className="text-gray-400">无法加载学习进度数据</div>
      </Card>
    );
  }

  const { overview, trends, recommendations } = data;

  // 计算掌握度百分比
  const totalLearned = overview.masteryDistribution.beginner + 
                      overview.masteryDistribution.elementary + 
                      overview.masteryDistribution.intermediate + 
                      overview.masteryDistribution.advanced;

  const masteryPercentages = {
    beginner: totalLearned > 0 ? (overview.masteryDistribution.beginner / totalLearned) * 100 : 0,
    elementary: totalLearned > 0 ? (overview.masteryDistribution.elementary / totalLearned) * 100 : 0,
    intermediate: totalLearned > 0 ? (overview.masteryDistribution.intermediate / totalLearned) * 100 : 0,
    advanced: totalLearned > 0 ? (overview.masteryDistribution.advanced / totalLearned) * 100 : 0
  };

  return (
    <div className="space-y-6">
      {/* 标签导航 */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        {[
          { key: 'overview', label: '总览', icon: TrendingUp },
          { key: 'words', label: '词汇', icon: BookOpen },
          { key: 'sentences', label: '句子', icon: MessageCircle },
          { key: 'recommendations', label: '建议', icon: Target }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-primary-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* 总览标签 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 关键指标 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{overview.totalWords}</div>
              <div className="text-gray-400 text-sm">学习词汇</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">{overview.totalSentences}</div>
              <div className="text-gray-400 text-sm">练习句子</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-lg mx-auto mb-3">
                <Clock className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-white">{overview.streakDays}</div>
              <div className="text-gray-400 text-sm">连续天数</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-lg mx-auto mb-3">
                <Award className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{overview.sm2Stats.masteryRate}%</div>
              <div className="text-gray-400 text-sm">掌握率</div>
            </Card>
          </div>

          {/* 掌握度分布 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-400" />
              掌握度分布
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">初学者 (0-25%)</span>
                <span className="text-gray-400">{overview.masteryDistribution.beginner} 词</span>
              </div>
              <Progress value={masteryPercentages.beginner} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-gray-300">入门 (26-50%)</span>
                <span className="text-gray-400">{overview.masteryDistribution.elementary} 词</span>
              </div>
              <Progress value={masteryPercentages.elementary} className="h-2 bg-yellow-500" />

              <div className="flex items-center justify-between">
                <span className="text-gray-300">中级 (51-75%)</span>
                <span className="text-gray-400">{overview.masteryDistribution.intermediate} 词</span>
              </div>
              <Progress value={masteryPercentages.intermediate} className="h-2 bg-orange-500" />

              <div className="flex items-center justify-between">
                <span className="text-gray-300">高级 (76-100%)</span>
                <span className="text-gray-400">{overview.masteryDistribution.advanced} 词</span>
              </div>
              <Progress value={masteryPercentages.advanced} className="h-2 bg-green-500" />
            </div>
          </Card>

          {/* 学习趋势 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              最近7天学习趋势
            </h3>
            
            <div className="space-y-4">
              {trends.daily.map((day, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <div className="text-white text-sm">
                      {new Date(day.date).toLocaleDateString('zh-CN', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {day.sessions} 次学习 · {Math.round(day.totalTime / 60)} 分钟
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-white text-sm">{day.score}</div>
                      <div className="text-gray-400 text-xs">{Math.round(day.accuracy * 100)}%</div>
                    </div>
                    <div className="w-2 h-8 bg-gray-700 rounded">
                      <div 
                        className="bg-primary-500 rounded transition-all duration-300"
                        style={{ 
                          height: `${Math.min(100, (day.sessions / 5) * 100)}%`,
                          width: '100%'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 复习提醒 */}
          <Card className="p-6 border-yellow-500/30 bg-yellow-500/5">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              复习提醒
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  {overview.wordsNeedReview}
                </div>
                <div className="text-gray-400 text-sm">词汇需要复习</div>
              </div>
              
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  {overview.sentencesNeedReview}
                </div>
                <div className="text-gray-400 text-sm">句子需要复习</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 推荐标签 */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {/* 优先复习词汇 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              优先复习词汇
            </h3>
            
            <div className="space-y-3">
              {recommendations.priorityWords.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="text-white font-medium">{item.word?.term}</div>
                    <div className="text-gray-400 text-sm">{item.word?.meaning}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-red-400 text-sm font-medium">
                      逾期 {item.daysSinceReview} 天
                    </div>
                    <div className="text-gray-400 text-xs">
                      优先级: {Math.abs(Math.round(item.priority))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 学习建议 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-400" />
              个性化建议
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="text-blue-400 font-medium mb-1">💡 学习计划建议</div>
                <div className="text-gray-300 text-sm">
                  每天学习 5-10 个新词汇，复习 10-15 个旧词汇，保持学习连续性
                </div>
              </div>
              
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="text-green-400 font-medium mb-1">🎯 重点提升</div>
                <div className="text-gray-300 text-sm">
                  建议多练习语法构句，提升英语表达的准确性和流利度
                </div>
              </div>
              
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="text-purple-400 font-medium mb-1">⚡ 学习效率</div>
                <div className="text-gray-300 text-sm">
                  可以尝试使用间隔重复法，在最佳时机复习词汇以提高记忆效果
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}