// lib/adaptiveDifficulty.ts - 自适应难度系统
import { getRecentActivity, getLearningStats } from './localStorage';

export interface DifficultyMetrics {
  accuracy: number;
  averageResponseTime: number;
  streakLength: number;
  sessionLength: number;
  recentPerformance: number[];
  currentLevel: number;
}

export interface DifficultyAdjustment {
  newLevel: number;
  reason: string;
  adjustmentType: 'increase' | 'decrease' | 'maintain';
  confidence: number;
}

export interface AdaptiveQuestion {
  id: number;
  content: string;
  options: string[];
  correctAnswer: string;
  difficultyLevel: number;
  category: string;
  estimatedTime: number;
  hint?: string;
  explanation?: string;
}

// 难度级别配置
const DIFFICULTY_CONFIG = {
  1: { name: '入门', timeLimit: 15, minAccuracy: 0.9, description: '基础词汇和简单句型' },
  2: { name: '初级', timeLimit: 12, minAccuracy: 0.8, description: '常用词汇和基本语法' },
  3: { name: '中级', timeLimit: 10, minAccuracy: 0.75, description: '中等词汇和复杂语法' },
  4: { name: '高级', timeLimit: 8, minAccuracy: 0.7, description: '高级词汇和复杂表达' },
  5: { name: '专家', timeLimit: 6, minAccuracy: 0.65, description: '专业词汇和高级语法' }
};

// 性能评估权重
const PERFORMANCE_WEIGHTS = {
  accuracy: 0.4,
  responseTime: 0.3,
  streak: 0.2,
  consistency: 0.1
};

/**
 * 分析用户当前表现
 */
export function analyzeUserPerformance(): DifficultyMetrics {
  const recentActivity = getRecentActivity();
  const learningStats = getLearningStats();
  
  // 计算准确率
  const accuracy = recentActivity.length > 0 ? 
    recentActivity.filter(a => a.isCorrect).length / recentActivity.length : 0.5;
  
  // 计算平均响应时间（简化版，实际应该记录响应时间）
  const averageResponseTime = 8; // 秒，暂时使用固定值
  
  // 计算最近连击长度
  let streakLength = 0;
  for (let i = 0; i < recentActivity.length; i++) {
    if (recentActivity[i].isCorrect) {
      streakLength++;
    } else {
      break;
    }
  }
  
  // 计算会话长度
  const sessionLength = recentActivity.length;
  
  // 最近10次答题的表现
  const recentPerformance = recentActivity
    .slice(0, 10)
    .map(activity => activity.isCorrect ? 1 : 0);
  
  return {
    accuracy,
    averageResponseTime,
    streakLength,
    sessionLength,
    recentPerformance,
    currentLevel: learningStats.currentLevel
  };
}

/**
 * 计算表现分数
 */
export function calculatePerformanceScore(metrics: DifficultyMetrics): number {
  const { accuracy, averageResponseTime, streakLength, recentPerformance } = metrics;
  
  // 准确率分数 (0-1)
  const accuracyScore = accuracy;
  
  // 响应时间分数 (越快越好，但不能太快)
  const optimalTime = 6; // 最佳响应时间
  const timeScore = Math.max(0, 1 - Math.abs(averageResponseTime - optimalTime) / 10);
  
  // 连击分数
  const streakScore = Math.min(1, streakLength / 10);
  
  // 一致性分数（最近表现的稳定性）
  const recentAccuracy = recentPerformance.length > 0 ? 
    recentPerformance.reduce((sum, val) => sum + val, 0) / recentPerformance.length : 0.5;
  const variance = recentPerformance.length > 1 ? 
    recentPerformance.reduce((sum, val) => sum + Math.pow(val - recentAccuracy, 2), 0) / recentPerformance.length : 0;
  const consistencyScore = Math.max(0, 1 - variance);
  
  // 综合分数
  return (
    accuracyScore * PERFORMANCE_WEIGHTS.accuracy +
    timeScore * PERFORMANCE_WEIGHTS.responseTime +
    streakScore * PERFORMANCE_WEIGHTS.streak +
    consistencyScore * PERFORMANCE_WEIGHTS.consistency
  );
}

/**
 * 建议难度调整
 */
export function suggestDifficultyAdjustment(metrics: DifficultyMetrics): DifficultyAdjustment {
  const performanceScore = calculatePerformanceScore(metrics);
  const currentLevel = metrics.currentLevel;
  const currentConfig = DIFFICULTY_CONFIG[currentLevel as keyof typeof DIFFICULTY_CONFIG];
  
  let adjustmentType: 'increase' | 'decrease' | 'maintain' = 'maintain';
  let newLevel = currentLevel;
  let reason = '表现稳定，维持当前难度';
  let confidence = 0.5;
  
  // 判断是否需要提升难度
  if (performanceScore > 0.8 && metrics.accuracy > (currentConfig?.minAccuracy || 0.8)) {
    if (metrics.streakLength >= 5 && currentLevel < 5) {
      adjustmentType = 'increase';
      newLevel = Math.min(5, currentLevel + 1);
      reason = `表现优秀 (准确率: ${(metrics.accuracy * 100).toFixed(1)}%, 连击: ${metrics.streakLength})，提升难度`;
      confidence = Math.min(0.9, performanceScore);
    }
  }
  // 判断是否需要降低难度
  else if (performanceScore < 0.4 || metrics.accuracy < 0.6) {
    if (currentLevel > 1) {
      adjustmentType = 'decrease';
      newLevel = Math.max(1, currentLevel - 1);
      reason = `表现需要改善 (准确率: ${(metrics.accuracy * 100).toFixed(1)}%)，降低难度`;
      confidence = Math.min(0.9, 1 - performanceScore);
    }
  }
  
  return {
    newLevel,
    reason,
    adjustmentType,
    confidence
  };
}

/**
 * 生成适应性题目
 */
export function generateAdaptiveQuestions(
  difficulty: number, 
  category: string = 'general',
  count: number = 10
): AdaptiveQuestion[] {
  // 基础题目库（实际应用中应该从数据库获取）
  const questionBank: AdaptiveQuestion[] = [
    // 难度1题目
    {
      id: 1,
      content: 'apple',
      options: ['苹果', '香蕉', '橙子', '葡萄'],
      correctAnswer: '苹果',
      difficultyLevel: 1,
      category: 'food',
      estimatedTime: 5,
      hint: '这是一种红色的水果',
      explanation: 'Apple是苹果的意思，是最常见的水果之一'
    },
    {
      id: 2,
      content: 'cat',
      options: ['狗', '猫', '鸟', '鱼'],
      correctAnswer: '猫',
      difficultyLevel: 1,
      category: 'animal',
      estimatedTime: 4,
      hint: '这是一种会"喵喵"叫的动物',
      explanation: 'Cat是猫的意思，是常见的宠物'
    },
    // 难度2题目
    {
      id: 3,
      content: 'beautiful',
      options: ['丑陋的', '美丽的', '普通的', '奇怪的'],
      correctAnswer: '美丽的',
      difficultyLevel: 2,
      category: 'adjective',
      estimatedTime: 7,
      hint: '用来形容外表很好看的东西',
      explanation: 'Beautiful意为美丽的，是常用的形容词'
    },
    {
      id: 4,
      content: 'important',
      options: ['不重要的', '重要的', '普通的', '困难的'],
      correctAnswer: '重要的',
      difficultyLevel: 2,
      category: 'adjective',
      estimatedTime: 8,
      hint: '形容很有意义或价值的事物',
      explanation: 'Important意为重要的，表示具有重大意义'
    },
    // 难度3题目
    {
      id: 5,
      content: 'opportunity',
      options: ['困难', '机会', '问题', '挑战'],
      correctAnswer: '机会',
      difficultyLevel: 3,
      category: 'abstract',
      estimatedTime: 10,
      hint: '可以让你成功或发展的时机',
      explanation: 'Opportunity意为机会，指有利的时机或条件'
    },
    {
      id: 6,
      content: 'environment',
      options: ['环境', '建筑', '交通', '教育'],
      correctAnswer: '环境',
      difficultyLevel: 3,
      category: 'abstract',
      estimatedTime: 12,
      hint: '我们生活的周围条件和氛围',
      explanation: 'Environment意为环境，指周围的条件和影响'
    },
    // 难度4题目
    {
      id: 7,
      content: 'comprehension',
      options: ['理解', '困惑', '拒绝', '忽略'],
      correctAnswer: '理解',
      difficultyLevel: 4,
      category: 'academic',
      estimatedTime: 15,
      hint: '对事物含义的领悟和把握',
      explanation: 'Comprehension意为理解，指对信息的掌握和领悟'
    },
    // 难度5题目
    {
      id: 8,
      content: 'unprecedented',
      options: ['史无前例的', '常见的', '预期的', '重复的'],
      correctAnswer: '史无前例的',
      difficultyLevel: 5,
      category: 'advanced',
      estimatedTime: 20,
      hint: '从来没有发生过的',
      explanation: 'Unprecedented意为史无前例的，指前所未有的情况'
    }
  ];
  
  // 根据难度和类别筛选题目
  const filteredQuestions = questionBank.filter(q => {
    const difficultyMatch = q.difficultyLevel === difficulty;
    const categoryMatch = category === 'general' || q.category === category;
    return difficultyMatch && categoryMatch;
  });
  
  // 如果筛选后题目不够，添加相近难度的题目
  if (filteredQuestions.length < count) {
    const nearbyQuestions = questionBank.filter(q => {
      const difficultyMatch = Math.abs(q.difficultyLevel - difficulty) <= 1;
      const categoryMatch = category === 'general' || q.category === category;
      return difficultyMatch && categoryMatch && !filteredQuestions.includes(q);
    });
    filteredQuestions.push(...nearbyQuestions);
  }
  
  // 随机排序并返回指定数量
  const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 获取难度级别信息
 */
export function getDifficultyInfo(level: number) {
  return DIFFICULTY_CONFIG[level as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG[1];
}

/**
 * 实时难度调整
 */
export function realTimeDifficultyAdjustment(
  currentStreak: number,
  currentAccuracy: number,
  averageResponseTime: number,
  currentLevel: number
): number {
  let adjustment = 0;
  
  // 基于连击的实时调整
  if (currentStreak >= 8) {
    adjustment += 0.5; // 提升半级
  } else if (currentStreak <= 2 && currentAccuracy < 0.6) {
    adjustment -= 0.5; // 降低半级
  }
  
  // 基于响应时间的调整
  if (averageResponseTime < 4 && currentAccuracy > 0.9) {
    adjustment += 0.3; // 响应很快且准确，稍微提升
  } else if (averageResponseTime > 15) {
    adjustment -= 0.2; // 响应太慢，稍微降低
  }
  
  // 计算新难度级别
  const newLevel = Math.max(1, Math.min(5, currentLevel + adjustment));
  return Math.round(newLevel);
}

/**
 * 学习路径推荐
 */
export function recommendLearningPath(metrics: DifficultyMetrics): {
  recommendedCategories: string[];
  focusAreas: string[];
  nextGoals: string[];
} {
  const { accuracy, currentLevel, recentPerformance } = metrics;
  
  let recommendedCategories: string[] = [];
  let focusAreas: string[] = [];
  let nextGoals: string[] = [];
  
  // 基于难度级别推荐类别
  if (currentLevel <= 2) {
    recommendedCategories = ['food', 'animal', 'daily', 'basic'];
    focusAreas = ['基础词汇', '日常用语', '发音练习'];
    nextGoals = ['掌握500个基础单词', '提升发音准确度', '学会基本对话'];
  } else if (currentLevel <= 3) {
    recommendedCategories = ['adjective', 'verb', 'academic', 'business'];
    focusAreas = ['语法结构', '形容词和动词', '句型练习'];
    nextGoals = ['掌握1000个常用单词', '理解基本语法', '进行简单对话'];
  } else {
    recommendedCategories = ['advanced', 'technical', 'abstract', 'complex'];
    focusAreas = ['高级词汇', '复杂语法', '阅读理解'];
    nextGoals = ['掌握3000个高级单词', '理解复杂句型', '流利对话交流'];
  }
  
  // 基于表现调整焦点
  if (accuracy < 0.7) {
    focusAreas.unshift('基础巩固', '错题复习');
    nextGoals.unshift('提升答题准确率到80%以上');
  }
  
  return {
    recommendedCategories,
    focusAreas,
    nextGoals
  };
}