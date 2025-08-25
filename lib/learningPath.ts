// lib/learningPath.ts - 数据驱动的学习路径系统
import { getLearningStats, getRecentActivity, updateLearningStats } from './localStorage';
import { analyzeUserPerformance, suggestDifficultyAdjustment } from './adaptiveDifficulty';

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  modules: LearningModule[];
  prerequisites: string[];
  outcomes: string[];
  progress: number;
  isRecommended: boolean;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  type: 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'reading' | 'writing';
  estimatedTime: number; // 分钟
  activities: LearningActivity[];
  completed: boolean;
  score?: number;
  masteryLevel: number; // 0-100
}

export interface LearningActivity {
  id: string;
  title: string;
  type: 'word-blitz' | 'sentence-builder' | 'chinese-english' | 'listening' | 'speaking';
  content: any;
  difficulty: number;
  points: number;
  timeLimit?: number;
  completed: boolean;
  bestScore?: number;
  attempts: number;
}

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'vocabulary' | 'grammar' | 'fluency' | 'accuracy' | 'speed';
  progress: number;
}

export interface PersonalizedRecommendation {
  type: 'path' | 'module' | 'activity' | 'review';
  title: string;
  description: string;
  reason: string;
  confidence: number;
  estimatedBenefit: number;
  data: any;
}

// 预定义学习路径
const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'beginner-foundation',
    name: '英语入门基础',
    description: '适合零基础或基础薄弱的学习者，建立扎实的英语基础',
    estimatedDuration: '4-6周',
    difficulty: 'beginner',
    modules: [
      {
        id: 'basic-vocabulary',
        title: '基础词汇',
        description: '学习最常用的500个英语单词',
        type: 'vocabulary',
        estimatedTime: 180,
        activities: [],
        completed: false,
        masteryLevel: 0
      },
      {
        id: 'basic-grammar',
        title: '基础语法',
        description: '掌握基本的语法结构和时态',
        type: 'grammar',
        estimatedTime: 240,
        activities: [],
        completed: false,
        masteryLevel: 0
      }
    ],
    prerequisites: [],
    outcomes: ['掌握500个基础单词', '理解基本语法结构', '能进行简单对话'],
    progress: 0,
    isRecommended: false
  },
  {
    id: 'intermediate-conversation',
    name: '中级对话提升',
    description: '提升日常对话能力，增强语法应用和词汇量',
    estimatedDuration: '6-8周',
    difficulty: 'intermediate',
    modules: [
      {
        id: 'conversation-skills',
        title: '对话技巧',
        description: '学习日常对话的表达方式和技巧',
        type: 'speaking',
        estimatedTime: 300,
        activities: [],
        completed: false,
        masteryLevel: 0
      },
      {
        id: 'intermediate-vocabulary',
        title: '中级词汇',
        description: '掌握1000个中级词汇',
        type: 'vocabulary',
        estimatedTime: 360,
        activities: [],
        completed: false,
        masteryLevel: 0
      }
    ],
    prerequisites: ['beginner-foundation'],
    outcomes: ['掌握1500个单词', '能进行流畅对话', '理解复杂语法'],
    progress: 0,
    isRecommended: false
  },
  {
    id: 'advanced-mastery',
    name: '高级英语精通',
    description: '达到高级英语水平，掌握复杂表达和专业词汇',
    estimatedDuration: '8-12周',
    difficulty: 'advanced',
    modules: [
      {
        id: 'advanced-vocabulary',
        title: '高级词汇',
        description: '掌握3000个高级和专业词汇',
        type: 'vocabulary',
        estimatedTime: 480,
        activities: [],
        completed: false,
        masteryLevel: 0
      },
      {
        id: 'complex-grammar',
        title: '复杂语法',
        description: '掌握高级语法结构和表达方式',
        type: 'grammar',
        estimatedTime: 420,
        activities: [],
        completed: false,
        masteryLevel: 0
      }
    ],
    prerequisites: ['intermediate-conversation'],
    outcomes: ['掌握3000+单词', '精通复杂语法', '达到流利水平'],
    progress: 0,
    isRecommended: false
  }
];

// 预定义学习目标
const DEFAULT_GOALS: LearningGoal[] = [
  {
    id: 'daily-words',
    title: '每日单词学习',
    description: '每天学习20个新单词',
    targetValue: 20,
    currentValue: 0,
    unit: '个单词',
    priority: 'high',
    category: 'vocabulary',
    progress: 0
  },
  {
    id: 'weekly-accuracy',
    title: '周正确率目标',
    description: '本周答题正确率达到85%',
    targetValue: 85,
    currentValue: 0,
    unit: '%',
    priority: 'medium',
    category: 'accuracy',
    progress: 0
  },
  {
    id: 'monthly-mastery',
    title: '月度掌握目标',
    description: '本月完成3个学习模块',
    targetValue: 3,
    currentValue: 0,
    unit: '个模块',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    category: 'fluency',
    progress: 0
  }
];

/**
 * 分析学习行为模式
 */
export function analyzeLearningPatterns(): {
  preferredTimes: string[];
  sessionLength: number;
  difficultyPreference: string;
  activityPreferences: Record<string, number>;
  learningVelocity: number;
} {
  const activities = getRecentActivity();
  const stats = getLearningStats();

  // 分析偏好时间段（简化版）
  const hourCounts: Record<number, number> = {};
  activities.forEach(activity => {
    const hour = new Date(activity.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const preferredHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => {
      const h = parseInt(hour);
      if (h < 12) return '上午';
      if (h < 18) return '下午';
      return '晚上';
    });

  const preferredTimes = [...new Set(preferredHours)];

  // 计算平均会话时长
  const sessionLength = activities.length > 0 ? Math.round(stats.totalStudyTime / (activities.length / 10)) : 15;

  // 分析活动类型偏好
  const activityCounts: Record<string, number> = {};
  activities.forEach(activity => {
    activityCounts[activity.sessionType] = (activityCounts[activity.sessionType] || 0) + 1;
  });

  const totalActivities = activities.length || 1;
  const activityPreferences: Record<string, number> = {};
  Object.entries(activityCounts).forEach(([type, count]) => {
    activityPreferences[type] = count / totalActivities;
  });

  // 计算学习速度
  const recentAccuracy = activities.length > 0 ? 
    activities.filter(a => a.isCorrect).length / activities.length : 0.5;
  const learningVelocity = recentAccuracy * (stats.totalStudyTime / 60); // 基于准确率和学习时长

  return {
    preferredTimes,
    sessionLength,
    difficultyPreference: stats.currentLevel >= 3 ? 'advanced' : stats.currentLevel >= 2 ? 'intermediate' : 'beginner',
    activityPreferences,
    learningVelocity
  };
}

/**
 * 生成个性化推荐
 */
export function generatePersonalizedRecommendations(): PersonalizedRecommendation[] {
  const stats = getLearningStats();
  const performance = analyzeUserPerformance();
  const patterns = analyzeLearningPatterns();
  const difficultyAdjustment = suggestDifficultyAdjustment(performance);
  
  const recommendations: PersonalizedRecommendation[] = [];

  // 基于表现推荐难度调整
  if (difficultyAdjustment.adjustmentType !== 'maintain') {
    recommendations.push({
      type: 'activity',
      title: difficultyAdjustment.adjustmentType === 'increase' ? '挑战更高难度' : '巩固基础知识',
      description: difficultyAdjustment.reason,
      reason: `基于你的表现分析：准确率 ${(performance.accuracy * 100).toFixed(1)}%`,
      confidence: difficultyAdjustment.confidence,
      estimatedBenefit: 0.8,
      data: { newLevel: difficultyAdjustment.newLevel }
    });
  }

  // 基于学习模式推荐路径
  const recommendedPath = LEARNING_PATHS.find(path => 
    path.difficulty === patterns.difficultyPreference
  );
  
  if (recommendedPath && recommendedPath.progress < 100) {
    recommendations.push({
      type: 'path',
      title: `推荐学习路径：${recommendedPath.name}`,
      description: recommendedPath.description,
      reason: `基于你的当前水平（等级${stats.currentLevel}）和学习偏好`,
      confidence: 0.9,
      estimatedBenefit: 0.95,
      data: recommendedPath
    });
  }

  // 基于活动偏好推荐
  const favoriteActivity = Object.entries(patterns.activityPreferences)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (favoriteActivity && favoriteActivity[1] > 0.3) {
    recommendations.push({
      type: 'activity',
      title: `继续练习${favoriteActivity[0]}`,
      description: '基于你的学习偏好，继续这种类型的练习',
      reason: `你在${favoriteActivity[0]}上表现很好，占总练习的${(favoriteActivity[1] * 100).toFixed(1)}%`,
      confidence: 0.7,
      estimatedBenefit: 0.6,
      data: { activityType: favoriteActivity[0] }
    });
  }

  // 基于薄弱环节推荐复习
  if (performance.accuracy < 0.7) {
    recommendations.push({
      type: 'review',
      title: '强化复习建议',
      description: '重点复习错误率较高的内容',
      reason: `当前准确率${(performance.accuracy * 100).toFixed(1)}%，建议加强练习`,
      confidence: 0.8,
      estimatedBenefit: 0.85,
      data: { focusArea: 'accuracy' }
    });
  }

  // 基于时间模式推荐学习时间
  if (patterns.preferredTimes.length > 0) {
    recommendations.push({
      type: 'activity',
      title: `在${patterns.preferredTimes[0]}学习效果更好`,
      description: '基于你的学习习惯，这个时间段学习效率最高',
      reason: `数据显示你在${patterns.preferredTimes.join('和')}的学习活跃度最高`,
      confidence: 0.6,
      estimatedBenefit: 0.4,
      data: { recommendedTimes: patterns.preferredTimes }
    });
  }

  // 按信心度和预期收益排序
  return recommendations.sort((a, b) => {
    const scoreA = a.confidence * a.estimatedBenefit;
    const scoreB = b.confidence * b.estimatedBenefit;
    return scoreB - scoreA;
  });
}

/**
 * 获取适合用户的学习路径
 */
export function getRecommendedLearningPaths(): LearningPath[] {
  const stats = getLearningStats();
  const performance = analyzeUserPerformance();
  
  const paths = LEARNING_PATHS.map(path => {
    let isRecommended = false;
    let adjustedProgress = path.progress;

    // 基于用户水平推荐
    if (path.difficulty === 'beginner' && stats.currentLevel <= 2) {
      isRecommended = true;
    } else if (path.difficulty === 'intermediate' && stats.currentLevel >= 2 && stats.currentLevel <= 4) {
      isRecommended = true;
    } else if (path.difficulty === 'advanced' && stats.currentLevel >= 4) {
      isRecommended = true;
    }

    // 基于表现调整推荐
    if (performance.accuracy > 0.8 && performance.streakLength > 5) {
      isRecommended = true;
    }

    return {
      ...path,
      isRecommended,
      progress: adjustedProgress
    };
  });

  return paths.sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return 0;
  });
}

/**
 * 更新学习目标进度
 */
export function updateLearningGoals(activityType: string, value: number): LearningGoal[] {
  const goals = getStoredGoals();
  
  return goals.map(goal => {
    let newCurrentValue = goal.currentValue;
    
    // 根据活动类型更新相应目标
    if (goal.id === 'daily-words' && (activityType === 'word-blitz' || activityType === 'vocabulary')) {
      newCurrentValue = Math.min(goal.targetValue, goal.currentValue + value);
    } else if (goal.id === 'weekly-accuracy') {
      // 这里需要更复杂的逻辑来计算准确率
      const performance = analyzeUserPerformance();
      newCurrentValue = Math.round(performance.accuracy * 100);
    }
    
    const progress = Math.round((newCurrentValue / goal.targetValue) * 100);
    
    return {
      ...goal,
      currentValue: newCurrentValue,
      progress: Math.min(100, progress)
    };
  });
}

/**
 * 从本地存储获取学习目标
 */
function getStoredGoals(): LearningGoal[] {
  if (typeof window === 'undefined') return DEFAULT_GOALS;
  
  try {
    const stored = localStorage.getItem('learning-goals');
    return stored ? JSON.parse(stored) : DEFAULT_GOALS;
  } catch (error) {
    console.warn('获取学习目标失败:', error);
    return DEFAULT_GOALS;
  }
}

/**
 * 保存学习目标到本地存储
 */
export function saveLearningGoals(goals: LearningGoal[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('learning-goals', JSON.stringify(goals));
  } catch (error) {
    console.warn('保存学习目标失败:', error);
  }
}

/**
 * 获取学习路径进度
 */
export function getPathProgress(pathId: string): number {
  if (typeof window === 'undefined') return 0;
  
  try {
    const stored = localStorage.getItem(`path-progress-${pathId}`);
    return stored ? JSON.parse(stored) : 0;
  } catch (error) {
    console.warn('获取路径进度失败:', error);
    return 0;
  }
}

/**
 * 更新学习路径进度
 */
export function updatePathProgress(pathId: string, progress: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`path-progress-${pathId}`, JSON.stringify(progress));
  } catch (error) {
    console.warn('更新路径进度失败:', error);
  }
}

/**
 * 生成学习报告
 */
export function generateLearningReport(): {
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  statistics: Record<string, any>;
} {
  const stats = getLearningStats();
  const performance = analyzeUserPerformance();
  const patterns = analyzeLearningPatterns();
  const goals = getStoredGoals();
  
  const completedGoals = goals.filter(g => g.progress >= 100);
  const averageAccuracy = Math.round(performance.accuracy * 100);
  
  const summary = `在过去的学习中，你完成了${completedGoals.length}个目标，平均准确率达到${averageAccuracy}%，已掌握${stats.totalWordsLearned}个单词。`;
  
  const strengths: string[] = [];
  const improvements: string[] = [];
  const recommendations: string[] = [];
  
  // 分析优势
  if (performance.accuracy > 0.8) {
    strengths.push('答题准确率很高，基础知识掌握扎实');
  }
  if (performance.streakLength > 5) {
    strengths.push('学习连续性很好，有良好的学习习惯');
  }
  if (stats.streakDays > 7) {
    strengths.push('坚持学习的毅力值得赞赏');
  }
  
  // 分析需要改进的地方
  if (performance.accuracy < 0.7) {
    improvements.push('提高答题准确率，建议加强基础练习');
  }
  if (performance.averageResponseTime > 15) {
    improvements.push('提高反应速度，增强对知识的熟练程度');
  }
  if (stats.totalStudyTime < 60) {
    improvements.push('增加学习时间，保证充足的练习量');
  }
  
  // 生成推荐
  const personalizedRecs = generatePersonalizedRecommendations();
  recommendations.push(...personalizedRecs.slice(0, 3).map(rec => rec.description));
  
  return {
    summary,
    strengths: strengths.length > 0 ? strengths : ['继续保持学习热情'],
    improvements: improvements.length > 0 ? improvements : ['当前表现良好，继续保持'],
    recommendations,
    statistics: {
      totalWords: stats.totalWordsLearned,
      accuracy: averageAccuracy,
      studyTime: stats.totalStudyTime,
      streak: stats.streakDays,
      completedGoals: completedGoals.length,
      totalGoals: goals.length
    }
  };
}