import { NextResponse } from 'next/server';
import { generateGameQuestions, loadCourseData, getAvailableCourseIds } from '@/lib/packagesData';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const courseIdParam = url.searchParams.get('courseId');
    const gameType = url.searchParams.get('gameType') || 'word-blitz';
    const indexParam = url.searchParams.get('index');
    const index = indexParam ? Math.max(0, parseInt(indexParam)) : 0;
    
    // 如果指定了课程ID，使用该课程
    if (courseIdParam) {
      const courseId = parseInt(courseIdParam);
      const courseData = loadCourseData(courseId);
      
      if (courseData.length === 0) {
        return NextResponse.json({ error: 'course not found' }, { status: 404 });
      }

      // 如果请求的是超出范围的顺序下标，返回完成标记
      if (gameType === 'word-blitz' && index >= courseData.length) {
        return NextResponse.json({ type: 'done', total: courseData.length, index });
      }

      // 如果请求的是超出范围的顺序下标，返回完成标记
      if (index >= courseData.length) {
        return NextResponse.json({ type: 'done', total: courseData.length, index });
      }

      // 根据游戏类型生成不同的题目
      if (gameType === 'word-blitz') {
        // 百词斩模式 - 顺序返回（按 index）单个单词和选择项
        const item = courseData[index];
        const allItems = courseData.concat(loadCourseData(1)); // 增加更多干扰项
        const choices = generateWordChoices(item.chinese, allItems);
        
        return NextResponse.json({
          type: 'word',
          word: {
            id: `${courseId}-word-${index}`,
            term: item.english,
            meaning: item.chinese,
            soundmark: item.soundmark
          },
          choices,
          total: courseData.length,
          index
        });
      } else if (gameType === 'sentence-builder') {
        // 连词造句模式 - 按 index 顺序返回
        const item = courseData[index];
        return NextResponse.json({
          type: 'item',
          item: {
            id: `${courseId}-sentence-${index}`,
            prompt: item.chinese,
            answer: item.english,
            tokens: generateSentenceTokens(item.english)
          },
          total: courseData.length,
          index
        });
      } else if (gameType === 'listening') {
        // 听写模式 - 按 index 顺序返回
        const item = courseData[index];
        return NextResponse.json({
          type: 'item',
          item: {
            id: `${courseId}-listening-${index}`,
            prompt: item.chinese,
            answer: item.english,
            audioUrl: null // 可以后续添加音频文件
          },
          total: courseData.length,
          index
        });
      } else {
        // 中译英模式 (chinese-english) - 按 index 顺序返回
        const item = courseData[index];
        return NextResponse.json({
          type: 'item',
          item: {
            id: `${courseId}-translation-${index}`,
            prompt: item.chinese,
            answer: item.english,
            tokens: generateSentenceTokens(item.english)
          },
          total: courseData.length,
          index
        });
      }
    }
    
    // 如果没有指定课程ID，随机选择一个课程
    const availableCourses = getAvailableCourseIds();
    if (availableCourses.length === 0) {
      return NextResponse.json({ error: 'no courses available' }, { status: 404 });
    }
    
    const randomCourseId = availableCourses[Math.floor(Math.random() * availableCourses.length)];
    const courseData = loadCourseData(randomCourseId);
    const item = courseData[Math.floor(Math.random() * courseData.length)];
    
    // 默认返回单词数据用于百词斩
    const allItems = courseData.concat(loadCourseData(1));
    const choices = generateWordChoices(item.chinese, allItems);
    
    return NextResponse.json({
      type: 'word',
      word: {
        id: `${randomCourseId}-word`,
        term: item.english,
        meaning: item.chinese,
        soundmark: item.soundmark
      },
      choices,
      total: courseData.length,
      index: 0
    });
    
  } catch (error) {
    console.error('Play next API error:', error);
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}

// 生成单词选择项
function generateWordChoices(correctAnswer: string, allItems: any[]): string[] {
  const choices = [correctAnswer];
  const used = new Set([correctAnswer.toLowerCase()]);
  
  while (choices.length < 4) {
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    if (!used.has(randomItem.chinese.toLowerCase()) && randomItem.chinese !== correctAnswer) {
      choices.push(randomItem.chinese);
      used.add(randomItem.chinese.toLowerCase());
    }
  }
  
  // 打乱选项顺序
  return choices.sort(() => Math.random() - 0.5);
}

// 生成句子构建的token
function generateSentenceTokens(sentence: string): string[] {
  const words = sentence.split(' ');
  // 添加一些干扰词
  const distractors = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'have', 'has', 'do', 'does', 'will', 'can', 'could'];
  const additionalDistractors = distractors.filter(() => Math.random() > 0.7).slice(0, 2);
  
  return [...words, ...additionalDistractors].sort(() => Math.random() - 0.5);
}
