import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export async function GET() {
  const top = await prisma.score.findMany({ orderBy: { points: 'desc' }, take: 20, include: { user: true } });
  const rows = top.map(t => ({ anonId: t.user.anonId, points: t.points }));
  return NextResponse.json({ leaderboard: rows });
}
