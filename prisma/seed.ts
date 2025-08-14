import { PrismaClient } from '@prisma/client';
import words from './words.json' assert { type: 'json' };
const prisma = new PrismaClient();
async function main() {
  for (const w of words) {
    await prisma.word.create({ data: { term: w.term, meaning: w.meaning, level: 1, imageUrl: w.imageUrl || null, audioUrl: w.audioUrl || null } });
  }
  const course = await prisma.course.create({ data: { slug: 'sample-sentence', title: '示例句子课程', mode: 'sentence-builder' } });
  const unit = await prisma.unit.create({ data: { courseId: course.id, index: 1, title: 'Unit 1' } });
  await prisma.item.createMany({ data: [
    { unitId: unit.id, type: 'SENTENCE', prompt: '他昨天去了图书馆。', answer: 'He went to the library yesterday.' },
    { unitId: unit.id, type: 'SENTENCE', prompt: '请把门关上。', answer: 'Please close the door.' },
    { unitId: unit.id, type: 'SENTENCE', prompt: '我正在等公交车。', answer: 'I am waiting for the bus.' }
  ] });
  console.log('Seeded words and sample course.');
}
main().then(()=>prisma.$disconnect()).catch(async (e)=>{ console.error(e); await prisma.$disconnect(); process.exit(1); });
