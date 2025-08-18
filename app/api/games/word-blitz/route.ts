import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateSM2, convertToSM2Quality } from '@/lib/sm2';

const prisma = new PrismaClient();

// 获取用户词汇进度
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const difficulty = searchParams.get('difficulty') || 'beginner';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 根据难度等级获取词汇
    const levelMap = {
      'beginner': [1],
      'intermediate': [1, 2],
      'advanced': [2, 3]
    };

    const words = await prisma.word.findMany({
      where: {
        level: {
          in: levelMap[difficulty as keyof typeof levelMap]
        }
      },
      include: {
        progress: {
          where: {
            userId: userId
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    // 计算每个词汇的复习优先级
    const wordsWithPriority = words.map(word => {
      const progress = word.progress[0];
      
      if (!progress) {
        // 新词汇，优先级最高
        return {
          ...word,
          priority: 1000,
          needsReview: true,
          masteryLevel: 0
        };
      }

      const needsReview = new Date() >= progress.nextDue;
      const priority = needsReview ? 
        -(Math.floor((new Date().getTime() - progress.nextDue.getTime()) / (1000 * 60 * 60 * 24)) * 10 + (3 - progress.efactor) * 5) :
        0;

      return {
        ...word,
        priority,
        needsReview,
        masteryLevel: Math.min(100, progress.repetitions * 20),
        progress: progress
      };
    });

    // 按优先级排序，优先显示需要复习的词汇
    const sortedWords = wordsWithPriority.sort((a, b) => b.priority - a.priority);

    return NextResponse.json({ 
      words: sortedWords.slice(0, 20), // 限制返回20个词汇
      total: words.length 
    });

  } catch (error) {
    console.error('Error fetching word blitz data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 保存游戏结果
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      gameResults, 
      attempts 
    } = body;

    if (!userId || !gameResults) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // 创建学习会话记录
    const session = await prisma.learningSession.create({
      data: {
        userId,
        gameType: 'word-blitz',
        endedAt: new Date(),
        score: gameResults.score,
        accuracy: gameResults.accuracy / 100,
        timeSpent: gameResults.timeSpent,
        streakCount: gameResults.streakCount,
        totalQuestions: gameResults.totalQuestions,
        correctAnswers: gameResults.correctAnswers
      }
    });

    // 处理每个答题记录并更新SM-2进度
    for (const attempt of attempts) {
      // 保存答题记录
      await prisma.sessionAttempt.create({
        data: {
          sessionId: session.id,
          itemType: 'word',
          itemId: attempt.wordId.toString(),
          correct: attempt.correct,
          timeSpent: attempt.timeSpent,
          hintsUsed: attempt.hintsUsed || 0,
          answerData: JSON.stringify({
            question: attempt.question,
            userAnswer: attempt.userAnswer,
            correctAnswer: attempt.correctAnswer
          })
        }
      });

      // 更新或创建词汇学习进度
      const existingProgress = await prisma.progress.findFirst({
        where: {
          userId,
          wordId: attempt.wordId
        }
      });

      // 计算SM-2质量评分
      const quality = convertToSM2Quality(
        attempt.correct,
        attempt.timeSpent,
        attempt.hintsUsed || 0
      );

      if (existingProgress) {
        // 更新现有进度
        const sm2Result = calculateSM2({
          repetitions: existingProgress.repetitions,
          interval: existingProgress.interval,
          easeFactor: existingProgress.efactor,
          nextDue: existingProgress.nextDue
        }, quality);

        await prisma.progress.update({
          where: { id: existingProgress.id },
          data: {
            repetitions: sm2Result.repetitions,
            interval: sm2Result.interval,
            efactor: sm2Result.easeFactor,
            nextDue: sm2Result.nextDue
          }
        });
      } else {
        // 创建新的进度记录
        const sm2Result = calculateSM2({
          repetitions: 0,
          interval: 0,
          easeFactor: 2.5,
          nextDue: new Date()
        }, quality);

        await prisma.progress.create({
          data: {
            userId,
            wordId: attempt.wordId,
            repetitions: sm2Result.repetitions,
            interval: sm2Result.interval,
            efactor: sm2Result.easeFactor,
            nextDue: sm2Result.nextDue
          }
        });
      }
    }

    // 更新用户统计数据
    const stats = await prisma.learningStats.findUnique({
      where: { userId }
    });

    if (stats) {
      await prisma.learningStats.update({
        where: { userId },
        data: {
          totalStudyTime: stats.totalStudyTime + Math.ceil(gameResults.timeSpent / 60),
          totalSessions: stats.totalSessions + 1,
          wordsLearned: stats.wordsLearned + gameResults.correctAnswers,
          lastStudyDate: new Date(),
          streakDays: isToday(stats.lastStudyDate) ? stats.streakDays : stats.streakDays + 1
        }
      });
    } else {
      await prisma.learningStats.create({
        data: {
          userId,
          totalStudyTime: Math.ceil(gameResults.timeSpent / 60),
          totalSessions: 1,
          wordsLearned: gameResults.correctAnswers,
          lastStudyDate: new Date(),
          streakDays: 1
        }
      });
    }

    // 更新总分
    const userScore = await prisma.score.findUnique({
      where: { userId }
    });

    if (userScore) {
      await prisma.score.update({
        where: { userId },
        data: {
          points: userScore.points + gameResults.score
        }
      });
    } else {
      await prisma.score.create({
        data: {
          userId,
          points: gameResults.score
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      sessionId: session.id,
      message: 'Game results saved successfully' 
    });

  } catch (error) {
    console.error('Error saving word blitz results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 获取游戏统计
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 获取最近的游戏会话
    const recentSessions = await prisma.learningSession.findMany({
      where: {
        userId,
        gameType: 'word-blitz'
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: 10
    });

    // 获取学习统计
    const stats = await prisma.learningStats.findUnique({
      where: { userId }
    });

    // 获取词汇掌握情况
    const totalWords = await prisma.word.count();
    const learnedWords = await prisma.progress.count({
      where: {
        userId,
        repetitions: {
          gte: 1
        }
      }
    });

    // 获取需要复习的词汇数量
    const wordsForReview = await prisma.progress.count({
      where: {
        userId,
        nextDue: {
          lte: new Date()
        }
      }
    });

    return NextResponse.json({
      recentSessions,
      stats: {
        totalWords,
        learnedWords,
        wordsForReview,
        masteryRate: totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0,
        ...stats
      }
    });

  } catch (error) {
    console.error('Error fetching word blitz stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 辅助函数：检查日期是否是今天
function isToday(date: Date | null): boolean {
  if (!date) return false;
  const today = new Date();
  return date.toDateString() === today.toDateString();
}