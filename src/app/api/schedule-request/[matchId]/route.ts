import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type RequestBody = {
  date: string;
  startTime: string;
  endTime: string;
  toPlayer: string;
  location?: string;
};

type ResponseBody = {
  action: 'confirm' | 'refuse' | 'counter';
  counterDate?: string;
  counterStart?: string;
  counterEnd?: string;
};

// GET – fetch current request for this match
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const req = await prisma.scheduleRequest.findUnique({ where: { matchId } });
  return NextResponse.json(req);
}

// POST – create a new proposal
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth();
  const playerName = session?.user?.playerName;
  if (!playerName) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { matchId } = await params;
  const body = await req.json() as RequestBody;

  const record = await prisma.scheduleRequest.upsert({
    where: { matchId },
    update: {
      fromPlayer: playerName,
      toPlayer: body.toPlayer,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      status: 'pending',
      counterDate: null,
      counterStart: null,
      counterEnd: null,
    },
    create: {
      matchId,
      fromPlayer: playerName,
      toPlayer: body.toPlayer,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
    },
  });

  return NextResponse.json(record);
}

// PATCH – respond to a proposal (confirm / refuse / counter)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth();
  const playerName = session?.user?.playerName;
  if (!playerName) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { matchId } = await params;
  const body = await req.json() as ResponseBody;

  const existing = await prisma.scheduleRequest.findUnique({ where: { matchId } });
  if (!existing || existing.toPlayer !== playerName) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updated = await prisma.scheduleRequest.update({
    where: { matchId },
    data: {
      status: body.action === 'counter' ? 'counter' : body.action,
      ...(body.action === 'counter' ? {
        counterDate: body.counterDate,
        counterStart: body.counterStart,
        counterEnd: body.counterEnd,
      } : {}),
    },
  });

  return NextResponse.json(updated);
}
