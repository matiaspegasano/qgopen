import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const requests = await prisma.scheduleRequest.findMany({
    where: { status: { in: ['confirmed', 'pending'] } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
  return NextResponse.json(requests);
}
