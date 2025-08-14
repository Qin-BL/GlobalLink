import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export async function GET() {
  const courses = await prisma.course.findMany({ include: { units: { include: { items: true } } } });
  return NextResponse.json({ courses });
}
