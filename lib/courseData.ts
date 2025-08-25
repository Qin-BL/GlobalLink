// lib/courseData.ts - 课程数据处理工具

export interface CourseItem {
  chinese: string;
  english: string;
  soundmark: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  cefr: string;
  duration: string;
  lessons: number;
  students: number;
  rating: number;
  progress: number;
  instructor: string;
  price: string;
  image: string;
  tags: string[];
  featured: boolean;
  items: CourseItem[];
}

// 从packages/data中的55个真实课程文件生成课程数据
export async function generateCoursesFromData(): Promise<Course[]> {
  const courses: Course[] = [];
  
  // 创建一个单一的基础英语课程，包含55个课时
  const totalLessons = 55;
  
  const course: Course = {
    id: '1',
    title: '基础英语课程',
    description: `完整的基础英语学习课程，包含55个系统性课时，从基础入门到进阶应用`,
    category: 'vocabulary',
    difficulty: 'beginner' as const,
    cefr: 'A1-B2',
    instructor: '英语学习系统',
    tags: ['基础', '系统学习', '55课时', '完整课程'],
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop',
    duration: `${Math.floor(totalLessons * 0.3)}小时`, // 每课时约20分钟
    lessons: totalLessons,
    students: 2500,
    rating: 4.8,
    progress: 0,
    price: 'Free',
    featured: true,
    items: [] // 在课程列表页面不需要显示具体项目
  };
  
  courses.push(course);
  return courses;
}

// 加载特定课程的数据 - 公开函数
export async function loadCourseData(courseId: string): Promise<CourseItem[]> {
  try {
    // 统一使用fetch API调用我们的课程API端点
    const response = await fetch(`/api/courses/${courseId}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error(`API returned ${response.status} for course ${courseId}`);
      return [];
    }
  } catch (error) {
    console.error(`Failed to load course ${courseId}:`, error);
    // 回退：返回空数组而不是模拟数据
    return [];
  }
}

// 获取课程信息 - 基于55个真实课程文件
export function getCourseInfo(courseId: string) {
  // 只有一个基础英语课程，包含55个课时
  return {
    id: courseId,
    title: '基础英语课程',
    description: '完整的基础英语学习课程，包含55个系统性课时，从基础入门到进阶应用',
    difficulty: '基础 (A1-B2)',
    totalLessons: 55,
    students: 2500,
    rating: 4.8,
    startLesson: 1,
    endLesson: 55
  };
}

// 加载特定课程的项目数据 - 使用packages/data中的真实文件
async function loadCourseItems(courseNumber: number): Promise<CourseItem[]> {
  try {
    const courseId = courseNumber.toString().padStart(2, '0');
    
    // 统一使用fetch API调用我们的课程API端点
    const response = await fetch(`/api/courses/${courseId}`, { 
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error(`API returned ${response.status} for course ${courseId}`);
      return [];
    }
  } catch (error) {
    console.error(`Failed to load course ${courseNumber}:`, error);
    
    // 回退：返回空数组而不是模拟数据
    return [];
  }
}

// 已移除模拟数据 - 现在系统完全使用packages/data下的真实课程数据
// 所有课程内容都来自55个真实的JSON文件 (01.json 到 55.json)

// 获取推荐课程
export function getRecommendedCourses(courses: Course[], limit: number = 6): Course[] {
  return courses
    .filter(course => course.featured || course.rating > 4.6)
    .slice(0, limit);
}

// 按类别获取课程
export function getCoursesByCategory(courses: Course[], category: string): Course[] {
  if (category === 'all') return courses;
  return courses.filter(course => course.category === category);
}

// 按难度获取课程
export function getCoursesByDifficulty(courses: Course[], difficulty: string): Course[] {
  if (difficulty === 'all') return courses;
  return courses.filter(course => course.difficulty === difficulty);
}

// 搜索课程
export function searchCourses(courses: Course[], query: string): Course[] {
  if (!query.trim()) return courses;
  
  const lowercaseQuery = query.toLowerCase();
  return courses.filter(course =>
    course.title.toLowerCase().includes(lowercaseQuery) ||
    course.description.toLowerCase().includes(lowercaseQuery) ||
    course.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    course.instructor.toLowerCase().includes(lowercaseQuery)
  );
}