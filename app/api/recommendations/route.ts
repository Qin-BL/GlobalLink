import { NextRequest, NextResponse } from 'next/server';
import coursesData from '@/data/courses.json';

// 模拟基于用户水平的课程推荐
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level') || 'beginner';
  const category = searchParams.get('category') || 'all';
  const limit = parseInt(searchParams.get('limit') || '6');

  try {
    let filteredCourses = coursesData;

    // 根据难度级别过滤
    if (level !== 'all') {
      filteredCourses = filteredCourses.filter(course => course.difficulty === level);
    }

    // 根据分类过滤
    if (category !== 'all') {
      filteredCourses = filteredCourses.filter(course => course.category === category);
    }

    // 根据特色和评分排序
    filteredCourses.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0; // 保持原顺序
    });

    // 限制返回数量
    const recommendedCourses = filteredCourses.slice(0, limit);

    // 添加推荐理由
    const coursesWithReasons = recommendedCourses.map(course => ({
      ...course,
      recommendation_reason: getRecommendationReason(course, level, category)
    }));

    return NextResponse.json({
      success: true,
      courses: coursesWithReasons,
      total: filteredCourses.length,
      filters: { level, category, limit }
    });

  } catch (error) {
    console.error('Error fetching course recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course recommendations' },
      { status: 500 }
    );
  }
}

function getRecommendationReason(course: any, level: string, category: string): string {
  const reasons: string[] = [];

  if (course.featured) {
    reasons.push('精选推荐');
  }

  if (course.price === 'Free') {
    reasons.push('免费课程');
  }

  if (course.difficulty === level) {
    reasons.push(`适合${level === 'beginner' ? '初学者' : level === 'intermediate' ? '中级学习者' : '高级学习者'}`);
  }

  if (course.category === category && category !== 'all') {
    const categoryNames = {
      'speaking': '口语',
      'business': '商务',
      'travel': '旅游',
      'grammar': '语法',
      'exam': '考试',
      'listening': '听力',
      'vocabulary': '词汇',
      'writing': '写作'
    };
    reasons.push(`${categoryNames[category as keyof typeof categoryNames]}专项`);
  }

  if (course.lessons >= 20) {
    reasons.push('内容丰富');
  }

  return reasons.join(' • ') || '推荐学习';
}