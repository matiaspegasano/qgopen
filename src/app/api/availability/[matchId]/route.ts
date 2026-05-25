import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/availability/[matchId]
// Returns { [playerName]: { [date]: string[] } }
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const rows = await prisma.availability.findMany({ where: { matchId } });
  const result: Record<string, Record<string, string[]>> = {};
  for (const r of rows) {
    if (!result[r.playerName]) result[r.playerName] = {};
    result[r.playerName][r.date] = JSON.parse(r.slots) as string[];
  }
  return NextResponse.json(result);
}

// POST /api/availability/[matchId]
// Body: { date: 'YYYY-MM-DD', slots: string[] }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth();
  const playerName = session?.user?.playerName;
  if (!playerName) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { matchId } = await params;
  const { date, slots } = await req.json() as { date: string; slots: string[] };

  await prisma.availability.upsert({
    where: { matchId_playerName_date: { matchId, playerName, date } },
    update: { slots: JSON.stringify(slots) },
    create: { matchId, playerName, date, slots: JSON.stringify(slots) },
  });

  return NextResponse.json({ ok: true });
}
