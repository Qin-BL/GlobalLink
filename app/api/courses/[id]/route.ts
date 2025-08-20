// app/api/courses/[id]/route.ts - 课程数据API路由

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // 验证课程ID格式
    if (!id || !/^\d{2}$/.test(id)) {
      return NextResponse.json(
        { error: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    // 构建文件路径
    const filePath = path.join(process.cwd(), 'packages', 'data', 'courses', `${id}.json`);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // 读取文件内容
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const courseData = JSON.parse(fileContent);

    // 返回课程数据
    return NextResponse.json(courseData);
    
  } catch (error) {
    console.error('Error loading course data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}