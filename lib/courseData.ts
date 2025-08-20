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

// 从JSON文件生成课程数据
export async function generateCoursesFromData(): Promise<Course[]> {
  const courses: Course[] = [];
  
  // 模拟从本地数据文件生成课程
  const courseTemplates = [
    {
      id: '1',
      title: '基础英语入门 - 第一课',
      description: '学习基本的日常英语表达，包括喜好、需求和时间概念',
      category: 'vocabulary',
      difficulty: 'beginner' as const,
      cefr: 'A1',
      instructor: 'Emma Wilson',
      tags: ['基础', '日常', '入门'],
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop'
    },
    {
      id: '2', 
      title: '日常对话进阶训练',
      description: '通过实际对话场景掌握更多实用表达',
      category: 'speaking',
      difficulty: 'beginner' as const,
      cefr: 'A2',
      instructor: 'Mike Chen',
      tags: ['对话', '实用', '进阶'],
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop'
    },
    {
      id: '3',
      title: '商务英语基础',
      description: '掌握基本的商务场景英语表达',
      category: 'business',
      difficulty: 'intermediate' as const,
      cefr: 'B1',
      instructor: 'Sarah Johnson',
      tags: ['商务', '职场', '专业'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop'
    },
    {
      id: '4',
      title: '语法结构强化',
      description: '系统学习英语语法结构和句型变化',
      category: 'grammar',
      difficulty: 'intermediate' as const,
      cefr: 'B2',
      instructor: 'Lisa Brown',
      tags: ['语法', '结构', '系统'],
      image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=250&fit=crop'
    },
    {
      id: '5',
      title: '高级表达技巧',
      description: '学习复杂的英语表达和高级语法运用',
      category: 'advanced',
      difficulty: 'advanced' as const,
      cefr: 'C1',
      instructor: 'David Smith',
      tags: ['高级', '表达', '技巧'],
      image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=250&fit=crop'
    }
  ];

  // 扩展课程模板，使用更多的本地数据
  const additionalTemplates = [
    {
      id: '6',
      title: '英语听力强化训练',
      description: '通过各种场景提升英语听力理解能力',
      category: 'listening',
      difficulty: 'intermediate' as const,
      cefr: 'B1',
      instructor: 'Tom Anderson',
      tags: ['听力', '理解', '实用'],
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop'
    },
    {
      id: '7',
      title: '旅游英语必备',
      description: '掌握旅游场景下的实用英语表达',
      category: 'speaking',
      difficulty: 'beginner' as const,
      cefr: 'A2',
      instructor: 'Anna Lee',
      tags: ['旅游', '实用', '对话'],
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop'
    },
    {
      id: '8',
      title: '学术英语写作',
      description: '提升学术写作和论文表达能力',
      category: 'grammar',
      difficulty: 'advanced' as const,
      cefr: 'C1',
      instructor: 'Prof. Johnson',
      tags: ['写作', '学术', '高级'],
      image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=250&fit=crop'
    }
  ];

  const allTemplates = [...courseTemplates, ...additionalTemplates];

  // 为每个模板生成完整的课程数据
  for (let i = 0; i < allTemplates.length; i++) {
    const template = allTemplates[i];
    const courseNumber = i + 1;
    
    try {
      // 尝试加载真实的课程数据
      const items: CourseItem[] = await loadCourseItems(courseNumber);
      
      const course: Course = {
        ...template,
        duration: `${Math.max(1, Math.floor(items.length / 20))}小时`,
        lessons: Math.max(1, Math.ceil(items.length / 30)),
        students: Math.floor(Math.random() * 3000) + 500,
        rating: Math.round((4.5 + Math.random() * 0.4) * 10) / 10,
        progress: Math.floor(Math.random() * 100),
        price: i < 4 ? 'Free' : 'Premium',
        featured: i < 3,
        items
      };
      
      courses.push(course);
    } catch (error) {
      console.error(`Failed to load course ${courseNumber}:`, error);
    }
  }

  return courses;
}

// 加载特定课程的数据 - 公开函数
export async function loadCourseData(courseId: string): Promise<CourseItem[]> {
  try {
    // 检查环境，如果在客户端，使用fetch API
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/courses/${courseId}`);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    }
    
    // 如果在服务端或API不可用，使用模拟数据
    const courseNumber = parseInt(courseId);
    return generateMockCourseItems(courseNumber);
  } catch (error) {
    console.error(`Failed to load course ${courseId}:`, error);
    // 回退到模拟数据
    const courseNumber = parseInt(courseId);
    return generateMockCourseItems(courseNumber);
  }
}

// 获取课程信息 - 公开函数
export function getCourseInfo(courseId: string) {
  const courseNum = parseInt(courseId);
  
  const courseInfos = [
    {
      id: '1',
      title: '零基础英语入门',
      description: '最适合零基础入门的英语课程，从基本问候开始，逐步建立英语基础',
      difficulty: '初级 (A1)',
      totalLessons: 8,
      students: 15000,
      rating: 4.8
    },
    {
      id: '2',
      title: '日常对话进阶',
      description: '通过实际生活场景学习英语对话，提升口语交流能力',
      difficulty: '初级-中级 (A2-B1)',
      totalLessons: 8,
      students: 12000,
      rating: 4.7
    },
    {
      id: '3',
      title: '商务英语基础',
      description: '职场必备英语技能，掌握商务沟通的核心表达方式',
      difficulty: '中级 (B1-B2)',
      totalLessons: 8,
      students: 8500,
      rating: 4.9
    },
    {
      id: '4',
      title: '语法结构强化',
      description: '系统学习英语语法规则，建立完整的语法体系',
      difficulty: '中级 (B2)',
      totalLessons: 7,
      students: 6800,
      rating: 4.6
    },
    {
      id: '5',
      title: '高级表达技巧',
      description: '学习地道的英语表达方式，提升语言的准确性和流畅度',
      difficulty: '高级 (C1)',
      totalLessons: 6,
      students: 4200,
      rating: 4.8
    }
  ];
  
  return courseInfos.find(info => info.id === courseId) || courseInfos[0];
}

// 加载特定课程的项目数据
async function loadCourseItems(courseNumber: number): Promise<CourseItem[]> {
  try {
    // 检查环境，如果在客户端，使用fetch API
    if (typeof window !== 'undefined') {
      const courseId = courseNumber.toString().padStart(2, '0');
      const response = await fetch(`/api/courses/${courseId}`);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    }
    
    // 如果在服务端或API不可用，使用模拟数据
    return generateMockCourseItems(courseNumber);
  } catch (error) {
    console.error(`Failed to load course ${courseNumber}:`, error);
    // 回退到模拟数据
    return generateMockCourseItems(courseNumber);
  }
}

// 生成模拟课程项目数据
function generateMockCourseItems(courseNumber: number): CourseItem[] {
  const courseDataSets = [
    // 课程1：基础词汇
    [
      { chinese: "我", english: "I", soundmark: "/aɪ/" },
      { chinese: "你", english: "you", soundmark: "/ju/" },
      { chinese: "他", english: "he", soundmark: "/hi/" },
      { chinese: "她", english: "she", soundmark: "/ʃi/" },
      { chinese: "喜欢", english: "like", soundmark: "/laɪk/" },
      { chinese: "想要", english: "want", soundmark: "/wɑnt/" },
      { chinese: "需要", english: "need", soundmark: "/nid/" },
      { chinese: "今天", english: "today", soundmark: "/tə'de/" },
      { chinese: "现在", english: "now", soundmark: "/naʊ/" },
      { chinese: "这里", english: "here", soundmark: "/hɪr/" },
      { chinese: "那里", english: "there", soundmark: "/ðɛr/" },
      { chinese: "什么", english: "what", soundmark: "/wʌt/" },
      { chinese: "哪里", english: "where", soundmark: "/wɛr/" },
      { chinese: "为什么", english: "why", soundmark: "/waɪ/" },
      { chinese: "怎么样", english: "how", soundmark: "/haʊ/" },
      { chinese: "好的", english: "good", soundmark: "/ɡʊd/" },
      { chinese: "很好", english: "very good", soundmark: "/ˈvɛri/ /ɡʊd/" },
      { chinese: "谢谢", english: "thank you", soundmark: "/θæŋk/ /ju/" },
      { chinese: "不客气", english: "you're welcome", soundmark: "/jʊr/ /ˈwɛlkəm/" },
      { chinese: "再见", english: "goodbye", soundmark: "/ɡʊdˈbaɪ/" }
    ],
    // 课程2：日常对话
    [
      { chinese: "早上好", english: "good morning", soundmark: "/ɡʊd/ /ˈmɔrnɪŋ/" },
      { chinese: "下午好", english: "good afternoon", soundmark: "/ɡʊd/ /ˌæftərˈnun/" },
      { chinese: "晚上好", english: "good evening", soundmark: "/ɡʊd/ /ˈivnɪŋ/" },
      { chinese: "晚安", english: "good night", soundmark: "/ɡʊd/ /naɪt/" },
      { chinese: "请", english: "please", soundmark: "/pliz/" },
      { chinese: "对不起", english: "sorry", soundmark: "/ˈsɔri/" },
      { chinese: "没关系", english: "it's okay", soundmark: "/ɪts/ /oʊˈkeɪ/" },
      { chinese: "帮助", english: "help", soundmark: "/hɛlp/" },
      { chinese: "问题", english: "problem", soundmark: "/ˈprɑbləm/" },
      { chinese: "回答", english: "answer", soundmark: "/ˈænsər/" },
      { chinese: "理解", english: "understand", soundmark: "/ˌʌndərˈstænd/" },
      { chinese: "知道", english: "know", soundmark: "/noʊ/" },
      { chinese: "学习", english: "learn", soundmark: "/lɜrn/" },
      { chinese: "工作", english: "work", soundmark: "/wɜrk/" },
      { chinese: "家", english: "home", soundmark: "/hoʊm/" },
      { chinese: "学校", english: "school", soundmark: "/skul/" },
      { chinese: "朋友", english: "friend", soundmark: "/frɛnd/" },
      { chinese: "家人", english: "family", soundmark: "/ˈfæməli/" },
      { chinese: "时间", english: "time", soundmark: "/taɪm/" },
      { chinese: "地方", english: "place", soundmark: "/pleɪs/" }
    ],
    // 课程3：商务英语
    [
      { chinese: "会议", english: "meeting", soundmark: "/ˈmitɪŋ/" },
      { chinese: "报告", english: "report", soundmark: "/rɪˈpɔrt/" },
      { chinese: "项目", english: "project", soundmark: "/ˈprɑdʒɛkt/" },
      { chinese: "团队", english: "team", soundmark: "/tim/" },
      { chinese: "经理", english: "manager", soundmark: "/ˈmænɪdʒər/" },
      { chinese: "客户", english: "client", soundmark: "/ˈklaɪənt/" },
      { chinese: "合同", english: "contract", soundmark: "/ˈkɑntrækt/" },
      { chinese: "预算", english: "budget", soundmark: "/ˈbʌdʒɪt/" },
      { chinese: "销售", english: "sales", soundmark: "/seɪlz/" },
      { chinese: "市场", english: "market", soundmark: "/ˈmɑrkɪt/" },
      { chinese: "产品", english: "product", soundmark: "/ˈprɑdʌkt/" },
      { chinese: "服务", english: "service", soundmark: "/ˈsɜrvɪs/" },
      { chinese: "质量", english: "quality", soundmark: "/ˈkwɑləti/" },
      { chinese: "价格", english: "price", soundmark: "/praɪs/" },
      { chinese: "折扣", english: "discount", soundmark: "/ˈdɪskaʊnt/" },
      { chinese: "竞争", english: "competition", soundmark: "/ˌkɑmpəˈtɪʃən/" },
      { chinese: "成功", english: "success", soundmark: "/səkˈsɛs/" },
      { chinese: "失败", english: "failure", soundmark: "/ˈfeɪljər/" },
      { chinese: "机会", english: "opportunity", soundmark: "/ˌɑpərˈtunəti/" },
      { chinese: "挑战", english: "challenge", soundmark: "/ˈtʃælɪndʒ/" }
    ]
  ];

  // 根据课程编号选择相应的数据集
  const dataSetIndex = (courseNumber - 1) % courseDataSets.length;
  const selectedDataSet = courseDataSets[dataSetIndex];
  
  // 根据课程难度调整返回的项目数量
  const baseCount = 15;
  const additionalItems = Math.floor(courseNumber / 3) * 5;
  const totalItems = Math.min(selectedDataSet.length, baseCount + additionalItems);
  
  return selectedDataSet.slice(0, totalItems);
}

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