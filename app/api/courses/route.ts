import { NextResponse } from 'next/server';
import { getAllCoursesInfo } from '@/lib/packagesData';

export async function GET() {
  try {
    // 从packages/data获取课程列表
    const coursesInfo = (getAllCoursesInfo().filter(Boolean) as any[]);
    
    const courses = coursesInfo.map((courseInfo: any) => ({
      id: courseInfo.id,
      title: courseInfo.title,
      mode: courseInfo.mode,
      description: courseInfo.description,
      lessons: courseInfo.itemCount,
      difficulty: courseInfo.difficulty,
      completed: false,
      progress: 0,
      preview: courseInfo.preview
    }));

    return NextResponse.json({
      success: true,
      courses
    });
  } catch (error) {
    console.error('获取课程列表失败:', error);
    return NextResponse.json(
      { error: '获取课程列表失败' },
      { status: 500 }
    );
  }
}
