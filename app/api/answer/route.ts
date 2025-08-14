import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export async function POST(req: Request) {
  const body = await req.json().catch(()=>({}));
  const { userId, type, id, ok } = body as { userId?: string, type?: string, id?: number, ok?: boolean };
  if (!type || !id || typeof ok !== 'boolean') return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({ where: { anonId: userId } });
    if (!user) user = await prisma.user.create({ data: { anonId: userId } });
  } else {
    user = await prisma.user.create({ data: { anonId: `anon-${Date.now()}-${Math.random()}` } });
  }
  const attempt = await prisma.attempt.create({ data: { userId: user.id, wordId: type==='word'? id: undefined, itemId: type==='item'? id: undefined, correct: ok } });
  // SM-2 scheduling
  const now = new Date();
  const quality = ok ? 5 : 2;
  let prog = null;
  if (type === 'word') {
    const wordId = id;
    prog = await prisma.progress.findFirst({ where: { userId: user.id, wordId } });
    if (!prog) {
      const repetitions = quality >= 3 ? 1 : 0;
      const efactor = 2.5;
      const interval = repetitions === 1 ? 1 : 0;
      const nextDue = repetitions === 1 ? new Date(now.getTime() + interval*24*3600*1000) : now;
      prog = await prisma.progress.create({ data: { userId: user.id, wordId, repetitions, interval, efactor, nextDue } });
    } else {
      let { repetitions, interval, efactor } = prog;
      if (quality < 3) { repetitions = 0; interval = 0; } else {
        const newReps = repetitions + 1;
        if (newReps === 1) interval = 1;
        else if (newReps === 2) interval = 6;
        else interval = Math.round(interval * efactor);
        repetitions = newReps;
      }
      efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (efactor < 1.3) efactor = 1.3;
      const nextDue = new Date(now.getTime() + Math.max(1, interval) * 24*3600*1000);
      prog = await prisma.progress.update({ where: { id: prog.id }, data: { repetitions, interval, efactor, nextDue } });
    }
  } else {
    const itemId = id;
    prog = await prisma.progress.findFirst({ where: { userId: user.id, itemId } });
    if (!prog) {
      const repetitions = quality >= 3 ? 1 : 0;
      const efactor = 2.5;
      const interval = repetitions === 1 ? 1 : 0;
      const nextDue = repetitions === 1 ? new Date(now.getTime() + interval*24*3600*1000) : now;
      prog = await prisma.progress.create({ data: { userId: user.id, itemId, repetitions, interval, efactor, nextDue } });
    } else {
      let { repetitions, interval, efactor } = prog;
      if (quality < 3) { repetitions = 0; interval = 0; } else {
        const newReps = repetitions + 1;
        if (newReps === 1) interval = 1;
        else if (newReps === 2) interval = 6;
        else interval = Math.round(interval * efactor);
        repetitions = newReps;
      }
      efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (efactor < 1.3) efactor = 1.3;
      const nextDue = new Date(now.getTime() + Math.max(1, interval) * 24*3600*1000);
      prog = await prisma.progress.update({ where: { id: prog.id }, data: { repetitions, interval, efactor, nextDue } });
    }
  }
  const delta = ok ? 10 : -2;
  let score = await prisma.score.findUnique({ where: { userId: user.id } });
  if (!score) score = await prisma.score.create({ data: { userId: user.id, points: Math.max(0, delta) } });
  else score = await prisma.score.update({ where: { id: score.id }, data: { points: Math.max(0, score.points + delta) } });
  return NextResponse.json({ ok: true, attempt, progress: prog, score: score.points });
}
