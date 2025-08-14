import fs from 'fs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = process.argv[2];
  if (!p) { console.error('Usage: tsx scripts/import-course.ts path/to/course.json'); process.exit(1); }
  const raw = fs.readFileSync(p,'utf-8'); const json = JSON.parse(raw);
  const course = await prisma.course.create({ data: { slug: json.course.slug||`course-${Date.now()}`, title: json.course.title||'Imported', mode: json.course.mode||'sentence-builder', meta: json.course.meta||{} } });
  for (const u of (json.units||[])) {
    const unit = await prisma.unit.create({ data: { courseId: course.id, index: u.index||0, title: u.title||'Unit' } });
    for (const it of (u.items||[])) {
      await prisma.item.create({ data: { unitId: unit.id, type: it.type||'SENTENCE', prompt: it.prompt||null, answer: it.answer||'', tokens: it.tokens||undefined, extras: it.extras||undefined } });
    }
  }
  console.log('Imported course', course.id);
  await prisma.$disconnect();
}
main().catch(async e=>{ console.error(e); await prisma.$disconnect(); process.exit(1); });
