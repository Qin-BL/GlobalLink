import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const courseId = url.searchParams.get('courseId');
  const anonId = url.searchParams.get('userId');
  let user: any = null;
  if (anonId) {
    user = await prisma.user.findUnique({ where: { anonId } });
    if (!user) {
      try {
        user = await prisma.user.create({ data: { anonId } });
      } catch (error) {
        // Handle unique constraint violation - user might have been created by another request
        user = await prisma.user.findUnique({ where: { anonId } });
        if (!user) {
          throw error; // Re-throw if it's a different error
        }
      }
    }
  }
  if (courseId) {
    const course = await prisma.course.findUnique({ where: { id: Number(courseId) }, include: { units: { include: { items: true } } } });
    if (!course) return NextResponse.json({ error: 'course not found' }, { status: 404 });
    if (course.mode === 'word-blitz') {
      if (user) {
        const due = await prisma.progress.findMany({ where: { userId: user.id, wordId: { not: null }, nextDue: { lte: new Date() } }, include: { word: true } });
        if (due.length) {
          const progress = due[Math.floor(Math.random()*due.length)];
          const word = progress.word;
          if (word) {
            return NextResponse.json({ type: 'word', word, choices: await buildChoices(word.id) });
          }
        }
      }
      const count = await prisma.word.count();
      if (count === 0) return NextResponse.json({ error: 'no words' }, { status: 404 });
      const skip = Math.floor(Math.random()*count);
      const word = await prisma.word.findFirst({ skip });
      if (!word) return NextResponse.json({ error: 'no word found' }, { status: 404 });
      return NextResponse.json({ type: 'word', word, choices: await buildChoices(word.id) });
    } else {
      const unitIds = course.units.map(u=>u.id);
      if (user) {
        const due = await prisma.progress.findMany({ where: { userId: user.id, itemId: { not: null }, nextDue: { lte: new Date() } }, include: { item: true } });
        if (due.length) {
          const it = due[Math.floor(Math.random()*due.length)].item;
          return NextResponse.json({ type: 'item', item: it });
        }
      }
      const items = await prisma.item.findMany({ where: { unitId: { in: unitIds } } });
      if (!items.length) return NextResponse.json({ error: 'no items' }, { status: 404 });
      const item = items[Math.floor(Math.random()*items.length)];
      return NextResponse.json({ type: 'item', item });
    }
  }
  const count = await prisma.word.count();
  if (count === 0) return NextResponse.json({ error: 'no words' }, { status: 404 });
  const skip = Math.floor(Math.random()*count);
  const word = await prisma.word.findFirst({ skip });
  if (!word) return NextResponse.json({ error: 'no word found' }, { status: 404 });
  return NextResponse.json({ type: 'word', word, choices: await buildChoices(word.id) });
  async function buildChoices(wordId:number) {
    const others = await prisma.word.findMany({ take: 50 });
    const pool = others.filter(w=>w.id!==wordId).map(w=>w.meaning);
    const set = new Set<string>();
    while (set.size < 3 && pool.length) {
      const idx = Math.floor(Math.random()*pool.length);
      set.add(pool[idx]); pool.splice(idx,1);
    }
    const choices = [ (await prisma.word.findUnique({ where: { id: wordId } }))?.meaning || '', ...Array.from(set) ];
    for (let i = choices.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [choices[i],choices[j]]=[choices[j],choices[i]]; }
    return choices;
  }
}
