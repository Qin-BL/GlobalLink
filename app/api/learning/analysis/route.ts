import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  calculateSM2, 
  convertToSM2Quality, 
  shouldReview, 
  getReviewPriority,
  calculateMasteryLevel,
  getLearningStats
} from '@/lib/sm2';

const prisma = new PrismaClient();

// 获取学习分析数据
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'overview';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (type === 'overview') {
      return await getOverviewAnalysis(userId);
    } else if (type === 'words') {
      return await getWordAnalysis(userId);
    } else if (type === 'sentences') {
      return await getSentenceAnalysis(userId);
    } else if (type === 'recommendations') {
      return await getRecommendations(userId);
    }

    return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });

  } catch (error) {
    console.error('Error getting learning analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 获取总体学习分析
async function getOverviewAnalysis(userId: string) {
  try {
    // 获取用户统计数据
    const stats = await prisma.learningStats.findUnique({
      where: { userId }
    });

    // 获取词汇学习进度
    const wordProgress = await prisma.progress.findMany({
      where: { userId },
      include: {
        word: true
      }
    });

    // 获取句子学习进度
    const sentenceProgress = await prisma.chineseProgress.findMany({
      where: { userId },
      include: {
        sentence: true
      }
    });

    // 获取最近的学习会话
    const recentSessions = await prisma.learningSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 10
    });

    // 计算SM-2统计
    const sm2Stats = getLearningStats(wordProgress.map(p => ({
      repetitions: p.repetitions,
      interval: p.interval,
      easeFactor: p.efactor,
      nextDue: p.nextDue
    })));

    // 计算掌握度分布
    const masteryDistribution = {
      beginner: 0,    // 0-25%
      elementary: 0,  // 26-50%
      intermediate: 0, // 51-75%
      advanced: 0     // 76-100%
    };

    wordProgress.forEach(progress => {
      const mastery = calculateMasteryLevel(progress.repetitions, progress.efactor);
      if (mastery <= 25) masteryDistribution.beginner++;
      else if (mastery <= 50) masteryDistribution.elementary++;
      else if (mastery <= 75) masteryDistribution.intermediate++;
      else masteryDistribution.advanced++;
    });

    // 计算学习趋势（最近7天）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyProgress = await prisma.learningSession.findMany({
      where: {
        userId,
        startedAt: {
          gte: sevenDaysAgo
        }
      },
      orderBy: { startedAt: 'asc' }
    });

    const dailyStats = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 6 + i);
      const dateStr = date.toDateString();
      
      const sessionsForDay = weeklyProgress.filter(session => 
        session.startedAt.toDateString() === dateStr
      );

      return {
        date: dateStr,
        sessions: sessionsForDay.length,
        totalTime: sessionsForDay.reduce((sum, s) => sum + (s.timeSpent || 0), 0),
        score: sessionsForDay.reduce((sum, s) => sum + s.score, 0),
        accuracy: sessionsForDay.length > 0 
          ? sessionsForDay.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessionsForDay.length
          : 0
      };
    });

    // 需要复习的内容
    const wordsNeedReview = wordProgress.filter(p => shouldReview(p.nextDue));
    const sentencesNeedReview = sentenceProgress.filter(p => 
      p.nextReviewDate <= new Date()
    );

    return NextResponse.json({
      overview: {
        totalWords: wordProgress.length,
        totalSentences: sentenceProgress.length,
        wordsNeedReview: wordsNeedReview.length,
        sentencesNeedReview: sentencesNeedReview.length,
        masteryDistribution,
        sm2Stats,
        streakDays: stats?.streakDays || 0,
        totalStudyTime: stats?.totalStudyTime || 0,
        totalSessions: recentSessions.length
      },
      trends: {
        daily: dailyStats,
        recentSessions: recentSessions.slice(0, 5).map(session => ({
          gameType: session.gameType,
          score: session.score,
          accuracy: session.accuracy,
          timeSpent: session.timeSpent,
          date: session.startedAt
        }))
      },
      recommendations: {
        priorityWords: wordsNeedReview
          .map(p => ({
            word: p.word,
            priority: getReviewPriority(p.nextDue, p.efactor),
            daysSinceReview: Math.floor((new Date().getTime() - p.nextDue.getTime()) / (1000 * 60 * 60 * 24))
          }))
          .sort((a, b) => b.priority - a.priority)
          .slice(0, 10),
        
        prioritySentences: sentencesNeedReview
          .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime())
          .slice(0, 5)
          .map(p => ({
            sentence: p.sentence,
            masteryLevel: p.masteryLevel,
            daysSinceReview: Math.floor((new Date().getTime() - p.nextReviewDate.getTime()) / (1000 * 60 * 60 * 24))
          }))
      }
    });

  } catch (error) {
    console.error('Error in getOverviewAnalysis:', error);
    throw error;
  }
}

// 获取词汇分析
async function getWordAnalysis(userId: string) {
  try {
    const wordProgress = await prisma.progress.findMany({
      where: { userId },
      include: {
        word: true
      }
    });

    // 按难度分组
    type WordGroupEntry = {
      word: any;
      mastery: number;
      repetitions: number;
      interval: number;
      nextDue: Date;
      easeFactor: number;
    };
    const difficultyGroups: {
      1: { words: WordGroupEntry[]; avgMastery: number };
      2: { words: WordGroupEntry[]; avgMastery: number };
      3: { words: WordGroupEntry[]; avgMastery: number };
    } = {
      1: { words: [], avgMastery: 0 },
      2: { words: [], avgMastery: 0 },
      3: { words: [], avgMastery: 0 }
    };

    wordProgress.forEach(progress => {
      const level = progress.word?.level || 1;
      const mastery = calculateMasteryLevel(progress.repetitions, progress.efactor);
      
      if (level === 1 || level === 2 || level === 3) {
        difficultyGroups[level].words.push({
          word: progress.word,
          mastery,
          repetitions: progress.repetitions,
          interval: progress.interval,
          nextDue: progress.nextDue,
          easeFactor: progress.efactor
        });
      }
    });

    // 计算每个难度的平均掌握度
    ([1, 2, 3] as const).forEach((key) => {
       const group = difficultyGroups[key];
       if (group.words.length > 0) {
         group.avgMastery = group.words.reduce((sum, w) => sum + w.mastery, 0) / group.words.length;
       }
     });

    // 最困难的词汇
    const difficultWords = wordProgress
      .filter(p => p.repetitions > 0)
      .map(p => ({
        word: p.word,
        mastery: calculateMasteryLevel(p.repetitions, p.efactor),
        easeFactor: p.efactor,
        attempts: p.repetitions
      }))
      .sort((a, b) => a.easeFactor - b.easeFactor)
      .slice(0, 10);

    // 即将掌握的词汇
    const almostMasteredWords = wordProgress
      .map(p => ({
        word: p.word,
        mastery: calculateMasteryLevel(p.repetitions, p.efactor),
        repetitions: p.repetitions,
        easeFactor: p.efactor
      }))
      .filter(w => w.mastery >= 70 && w.mastery < 90)
      .sort((a, b) => b.mastery - a.mastery)
      .slice(0, 10);

    return NextResponse.json({
      difficultyAnalysis: difficultyGroups,
      difficultWords,
      almostMasteredWords,
      totalWords: wordProgress.length,
      masteredWords: wordProgress.filter(p => 
        calculateMasteryLevel(p.repetitions, p.efactor) >= 80
      ).length
    });

  } catch (error) {
    console.error('Error in getWordAnalysis:', error);
    throw error;
  }
}

// 获取句子分析
async function getSentenceAnalysis(userId: string) {
  try {
    const sentenceProgress = await prisma.chineseProgress.findMany({
      where: { userId },
      include: {
        sentence: true
      }
    });

    // 按难度分组
    type SentenceGroupEntry = {
      sentence: any;
      masteryLevel: number;
      repetitions: number;
      easeFactor: number;
      nextReviewDate: Date;
    };
    const difficultyGroups: {
      1: { sentences: SentenceGroupEntry[]; avgMastery: number };
      2: { sentences: SentenceGroupEntry[]; avgMastery: number };
      3: { sentences: SentenceGroupEntry[]; avgMastery: number };
    } = {
      1: { sentences: [], avgMastery: 0 },
      2: { sentences: [], avgMastery: 0 },
      3: { sentences: [], avgMastery: 0 }
    };

    sentenceProgress.forEach(progress => {
      const difficulty = progress.sentence.difficulty;
      if (difficulty === 1 || difficulty === 2 || difficulty === 3) {
        difficultyGroups[difficulty].sentences.push({
          sentence: progress.sentence,
          masteryLevel: progress.masteryLevel,
          repetitions: progress.repetitions,
          easeFactor: progress.easeFactor,
          nextReviewDate: progress.nextReviewDate
        });
      }
    });

    // 计算平均掌握度
    ([1, 2, 3] as const).forEach((key) => {
       const group = difficultyGroups[key];
       if (group.sentences.length > 0) {
         group.avgMastery = group.sentences.reduce((sum, s) => sum + s.masteryLevel, 0) / group.sentences.length;
       }
     });

    // 按语法点分析
    const grammarAnalysis: { [key: string]: any } = {};
    sentenceProgress.forEach(progress => {
      const sentence = progress.sentence;
      if (sentence.grammarPattern) {
        if (!grammarAnalysis[sentence.grammarPattern]) {
          grammarAnalysis[sentence.grammarPattern] = {
            sentences: [],
            avgMastery: 0,
            count: 0
          };
        }
        grammarAnalysis[sentence.grammarPattern].sentences.push(progress);
        grammarAnalysis[sentence.grammarPattern].count++;
      }
    });

    // 计算语法点掌握度
    Object.keys(grammarAnalysis).forEach(pattern => {
      const analysis = grammarAnalysis[pattern];
      analysis.avgMastery = analysis.sentences.reduce((sum: number, s: any) => sum + s.masteryLevel, 0) / analysis.count;
    });

    return NextResponse.json({
      difficultyAnalysis: difficultyGroups,
      grammarAnalysis,
      totalSentences: sentenceProgress.length
    });

  } catch (error) {
    console.error('Error in getSentenceAnalysis:', error);
    throw error;
  }
}

// 获取学习建议
async function getRecommendations(userId: string) {
  try {
    const stats = await prisma.learningStats.findUnique({
      where: { userId }
    });

    const wordProgress = await prisma.progress.findMany({
      where: { userId },
      include: { word: true }
    });

    const recentSessions = await prisma.learningSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 5
    });

    const recommendations: string[] = [];

    // 基于学习时间的建议
    if (stats) {
      if (stats.streakDays < 3) {
        recommendations.push('建议每天至少学习15分钟，保持学习连续性');
      } else if (stats.streakDays >= 7) {
        recommendations.push('学习习惯很好！可以尝试增加学习时间或难度');
      }

      if (stats.totalStudyTime < 60) {
        recommendations.push('增加学习时间可以更好地巩固记忆');
      }
    }

    // 基于词汇掌握情况的建议
    const needReviewWords = wordProgress.filter(p => shouldReview(p.nextDue));
    if (needReviewWords.length > 20) {
      recommendations.push('有较多词汇需要复习，建议先复习旧词汇再学习新词汇');
    }

    const difficultWords = wordProgress.filter(p => p.efactor < 2.0);
    if (difficultWords.length > 5) {
      recommendations.push('有一些困难词汇，建议重点练习或使用助记方法');
    }

    // 基于最近表现的建议
    if (recentSessions.length > 0) {
      const avgAccuracy = recentSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / recentSessions.length;
      
      if (avgAccuracy < 0.6) {
        recommendations.push('最近准确率较低，建议降低学习难度，巩固基础');
      } else if (avgAccuracy > 0.9) {
        recommendations.push('表现优秀！可以尝试更高难度的内容');
      }
    }

    // 学习模块建议
    const gameTypeStats = recentSessions.reduce((acc, session) => {
      acc[session.gameType] = (acc[session.gameType] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    if (!gameTypeStats['word-blitz'] || gameTypeStats['word-blitz'] < 2) {
      recommendations.push('建议多使用词汇训练模块提升词汇量');
    }

    if (!gameTypeStats['sentence-builder'] || gameTypeStats['sentence-builder'] < 2) {
      recommendations.push('建议练习句子构建来提升语法能力');
    }

    if (!gameTypeStats['chinese-english'] || gameTypeStats['chinese-english'] < 2) {
      recommendations.push('建议进行口语练习提升表达能力');
    }

    // 个性化学习计划
    const learningPlan = {
      daily: {
        words: Math.max(5, Math.min(20, wordProgress.length * 0.1)),
        sentences: Math.max(2, Math.min(10, wordProgress.length * 0.05)),
        reviewTime: 15 // 分钟
      },
      weekly: {
        newWords: Math.max(20, Math.min(100, wordProgress.length * 0.5)),
        reviewSessions: 5,
        practiceTime: 120 // 分钟
      }
    };

    return NextResponse.json({
      recommendations,
      learningPlan,
      nextReview: {
        words: needReviewWords.slice(0, 10).map(p => ({
          word: p.word,
          priority: getReviewPriority(p.nextDue, p.efactor)
        })),
        urgentCount: needReviewWords.length
      },
      strengths: identifyStrengths(wordProgress, recentSessions),
      weaknesses: identifyWeaknesses(wordProgress, recentSessions)
    });

  } catch (error) {
    console.error('Error in getRecommendations:', error);
    throw error;
  }
}

// 识别优势
function identifyStrengths(wordProgress: any[], recentSessions: any[]): string[] {
  const strengths: string[] = [];

  if (recentSessions.length > 0) {
    const avgAccuracy = recentSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / recentSessions.length;
    if (avgAccuracy > 0.8) {
      strengths.push('学习准确率很高，理解能力强');
    }

    const totalScore = recentSessions.reduce((sum, s) => sum + s.score, 0);
    if (totalScore > 1000) {
      strengths.push('学习积极性高，完成了大量练习');
    }
  }

  const masteredWords = wordProgress.filter(p => 
    calculateMasteryLevel(p.repetitions, p.efactor) >= 80
  );
  if (masteredWords.length > 50) {
    strengths.push('词汇掌握量大，基础扎实');
  }

  return strengths;
}

// 识别弱点
function identifyWeaknesses(wordProgress: any[], recentSessions: any[]): string[] {
  const weaknesses: string[] = [];

  const difficultWords = wordProgress.filter(p => p.efactor < 2.0);
  if (difficultWords.length > 10) {
    weaknesses.push('有较多困难词汇需要重点关注');
  }

  if (recentSessions.length > 0) {
    const avgAccuracy = recentSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / recentSessions.length;
    if (avgAccuracy < 0.6) {
      weaknesses.push('学习准确率有待提高');
    }
  }

  const needReviewWords = wordProgress.filter(p => shouldReview(p.nextDue));
  if (needReviewWords.length > 30) {
    weaknesses.push('复习任务较重，需要合理安排时间');
  }

  return weaknesses;
}