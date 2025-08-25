// lib/packagesData.ts - 处理 packages/data 中的课程数据

import fs from 'fs';
import path from 'path';

export interface CourseItem {
  chinese: string;
  english: string;
  soundmark: string;
}

export interface GameQuestion {
  id: string;
  type: 'translation' | 'sentence-builder' | 'word-blitz';
  prompt: string;
  answer: string;
  options?: string[];
  tokens?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  courseId: number;
}

// 获取所有可用的课程ID
export function getAvailableCourseIds(): number[] {
  try {
    const coursesDir = path.join(process.cwd(), 'packages', 'data', 'courses');
    const files = fs.readdirSync(coursesDir);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => parseInt(file.replace('.json', '')))
      .filter(id => !isNaN(id))
      .sort((a, b) => a - b);
  } catch (error) {
    console.error('Error reading course directory:', error);
    return [];
  }
}

// 加载特定课程数据
export function loadCourseData(courseId: number): CourseItem[] {
  try {
    const filePath = path.join(process.cwd(), 'packages', 'data', 'courses', `${courseId.toString().padStart(2, '0')}.json`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent) as CourseItem[];
  } catch (error) {
    console.error(`Error loading course ${courseId}:`, error);
    return [];
  }
}

// 生成不同类型的游戏题目
export function generateGameQuestions(courseId: number, type: 'translation' | 'sentence-builder' | 'word-blitz', count = 10): GameQuestion[] {
  const courseData = loadCourseData(courseId);
  if (courseData.length === 0) return [];

  const questions: GameQuestion[] = [];
  const usedIndices = new Set<number>();

  while (questions.length < count && usedIndices.size < courseData.length) {
    const randomIndex = Math.floor(Math.random() * courseData.length);
    if (usedIndices.has(randomIndex)) continue;
    
    usedIndices.add(randomIndex);
    const item = courseData[randomIndex];

    let question: GameQuestion;

    switch (type) {
      case 'translation':
        // 中英对照游戏
        question = {
          id: `${courseId}-${randomIndex}-translation`,
          type: 'translation',
          prompt: item.chinese,
          answer: item.english,
          options: generateTranslationOptions(item.english, courseData),
          difficulty: determineDifficulty(item),
          courseId
        };
        break;

      case 'sentence-builder':
        // 连词造句游戏
        question = {
          id: `${courseId}-${randomIndex}-sentence`,
          type: 'sentence-builder',
          prompt: item.chinese,
          answer: item.english,
          tokens: generateSentenceTokens(item.english),
          difficulty: determineDifficulty(item),
          courseId
        };
        break;

      case 'word-blitz':
        // 百词斩游戏
        question = {
          id: `${courseId}-${randomIndex}-word`,
          type: 'word-blitz',
          prompt: item.chinese,
          answer: item.english,
          options: generateWordOptions(item.english, courseData),
          difficulty: determineDifficulty(item),
          courseId
        };
        break;
    }

    questions.push(question);
  }

  return questions;
}

// 生成翻译选项
function generateTranslationOptions(correctAnswer: string, courseData: CourseItem[]): string[] {
  const options = [correctAnswer];
  const used = new Set([correctAnswer.toLowerCase()]);

  while (options.length < 4) {
    const randomItem = courseData[Math.floor(Math.random() * courseData.length)];
    if (!used.has(randomItem.english.toLowerCase()) && randomItem.english !== correctAnswer) {
      options.push(randomItem.english);
      used.add(randomItem.english.toLowerCase());
    }
  }

  // 打乱选项顺序
  return options.sort(() => Math.random() - 0.5);
}

// 生成句子构建的token
function generateSentenceTokens(sentence: string): string[] {
  const words = sentence.split(' ');
  // 添加一些干扰词
  const distractors = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'have', 'has', 'do', 'does', 'will', 'can', 'could'];
  const additionalDistractors = distractors.filter(() => Math.random() > 0.7).slice(0, 2);
  
  return [...words, ...additionalDistractors].sort(() => Math.random() - 0.5);
}

// 生成单词选项
function generateWordOptions(correctAnswer: string, courseData: CourseItem[]): string[] {
  return generateTranslationOptions(correctAnswer, courseData);
}

// 确定难度级别
function determineDifficulty(item: CourseItem): 'beginner' | 'intermediate' | 'advanced' {
  const wordCount = item.english.split(' ').length;
  const chineseLength = item.chinese.length;
  
  if (wordCount <= 2 && chineseLength <= 3) {
    return 'beginner';
  } else if (wordCount <= 5 && chineseLength <= 8) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
}

// 获取课程信息
export function getCourseInfo(courseId: number) {
  const courseData = loadCourseData(courseId);
  if (courseData.length === 0) return null;

  // 根据课程ID生成有意义的标题和描述
  const courseTitles: Record<number, { title: string; mode: string }> = {
    1: { title: '基础英语入门 - 第一课', mode: '初级' },
    2: { title: '日常对话基础', mode: '初级' },
    3: { title: '基础语法结构', mode: '初级' },
    4: { title: '生活用语表达', mode: '初级' },
    5: { title: '时间与日期', mode: '初级' },
    6: { title: '家庭与关系', mode: '中级' },
    7: { title: '工作与职业', mode: '中级' },
    8: { title: '购物与消费', mode: '中级' },
    9: { title: '健康与医疗', mode: '中级' },
    10: { title: '旅行与交通', mode: '中级' }
  };

  const courseInfo = courseTitles[courseId] || { 
    title: `第${courseId}课`, 
    mode: courseId <= 20 ? '初级' : courseId <= 40 ? '中级' : '高级' 
  };

  return {
    id: courseId,
    title: courseInfo.title,
    mode: courseInfo.mode,
    description: `包含${courseData.length}个学习项目`,
    itemCount: courseData.length,
    difficulty: determineDifficulty(courseData[0]),
    preview: courseData.slice(0, 3).map(item => ({
      chinese: item.chinese,
      english: item.english
    }))
  };
}

// 获取所有课程信息
export function getAllCoursesInfo() {
  const courseIds = getAvailableCourseIds();
  return courseIds.map(id => getCourseInfo(id)).filter(Boolean);
}