import { PrismaClient } from '@prisma/client';
import words from './words.json' assert { type: 'json' };
import sentences from '../data/sentences.json' assert { type: 'json' };

const prisma = new PrismaClient();

async function main() {
  // 清理现有数据
  await prisma.item.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.word.deleteMany({});

  // 添加词汇
  for (const w of words) {
    await prisma.word.create({ 
      data: { 
        term: w.term, 
        meaning: w.meaning, 
        level: 1, 
        imageUrl: w.imageUrl || null, 
        audioUrl: w.audioUrl || null 
      } 
    });
  }

  // 创建示例课程
  const courses = [
    {
      slug: 'daily-conversation',
      title: '日常对话基础',
      mode: 'sentence-builder',
      meta: JSON.stringify({ description: '学习最实用的日常英语对话' })
    },
    {
      slug: 'business-english',
      title: '商务英语基础',
      mode: 'sentence-builder',
      meta: JSON.stringify({ description: '职场必备的英语表达' })
    },
    {
      slug: 'intermediate-practice',
      title: '中级句型练习',
      mode: 'sentence-builder',
      meta: JSON.stringify({ description: '提升英语表达能力的中级练习' })
    }
  ];

  for (const courseData of courses) {
    const course = await prisma.course.create({ data: courseData });
    const unit = await prisma.unit.create({ 
      data: { 
        courseId: course.id, 
        index: 1, 
        title: `${courseData.title} - Unit 1` 
      } 
    });

    // 根据课程添加相应的句子
    let courseSentences: any[] = [];
    if (courseData.slug === 'daily-conversation') {
      courseSentences = sentences.filter(s => 
        s.category === 'daily' && s.difficulty === 'beginner'
      ).slice(0, 8);
    } else if (courseData.slug === 'business-english') {
      courseSentences = sentences.filter(s => 
        s.category === 'business' || s.category === 'formal'
      ).slice(0, 6);
    } else {
      courseSentences = sentences.filter(s => 
        s.difficulty === 'intermediate' || s.difficulty === 'advanced'
      ).slice(0, 10);
    }

    const itemsData = courseSentences.map(sentence => ({
      unitId: unit.id,
      type: 'SENTENCE' as const,
      prompt: sentence.chinese,
      answer: sentence.english
    }));

    await prisma.item.createMany({ data: itemsData });
  }

  console.log('Seeded words, sentences, and sample courses.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { 
    console.error(e); 
    await prisma.$disconnect(); 
    process.exit(1); 
  });
