'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import TitleBar from '@/components/TitleBar';
import Footer from '@/components/Footer';
import { parseMatchWindow, formatDate } from '@/lib/schedule';
import {
  editions, groupMatchesByEdition,
  mainBracketE2, consolationBracketE2, bronzeE2, consolationBronzeE2,
} from '@/lib/data';

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type ScheduleReq = {
  id: string;
  matchId: string;
  fromPlayer: string;
  toPlayer: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
};

type MatchEntry = {
  matchId: string;
  roundLabel: string;
  p1: string;
  p2: string;
  played: boolean;
};

type RoundData = {
  dates: string;
  start: string;
  end: string;
  phaseName: string;
  weekDays: string[];
  matches: MatchEntry[];
};

/* ------------------------------------------------------------------ */
/* BUILD ROUNDS FROM STATIC DATA                                       */
/* ------------------------------------------------------------------ */

function derivePhaseName(labels: string[]): string {
  const first = labels.find(Boolean) ?? '';
  if (/Rodada/.test(first)) return `${first} · Fase de Grupos`;  // e.g. "1ª Rodada · Fase de Grupos"
  if (/Quarta/.test(first)) return 'Quartas de Final';
  if (/Semi/.test(first)) return 'Semi-Final';
  return 'Finais';
}

function buildRounds(): RoundData[] {
  const activeEd = editions.find(e => e.status === 'active');
  if (!activeEd) return [];

  const byDates = new Map<string, MatchEntry[]>();

  const push = (dates: string, entry: MatchEntry) => {
    if (!byDates.has(dates)) byDates.set(dates, []);
    byDates.get(dates)!.push(entry);
  };

  const edGroups = groupMatchesByEdition[activeEd.id] ?? {};
  Object.values(edGroups).forEach(matches =>
    matches.forEach(m => push(m.dates, {
      matchId: m.id, roundLabel: m.round,
      p1: m.p1.name, p2: m.p2.name, played: m.winner !== undefined,
    }))
  );

  [
    ...mainBracketE2.flatMap(c => c.matches),
    ...consolationBracketE2.filter(c => !c.ghost).flatMap(c => c.matches),
    bronzeE2, consolationBronzeE2,
  ].forEach(m => push(m.dates, {
    matchId: m.id, roundLabel: m.round,
    p1: m.p1.name, p2: m.p2.name, played: !!(m.p1.w || m.p2.w),
  }));

  return [...byDates.entries()]
    .map(([dates, matches]) => {
      const weekDays = parseMatchWindow(dates);
      return {
        dates,
        start: weekDays[0],
        end: weekDays[weekDays.length - 1],
        phaseName: derivePhaseName(matches.map(m => m.roundLabel)),
        weekDays,
        matches,
      };
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

/* ------------------------------------------------------------------ */
/* DATE HELPERS                                                        */
/* ------------------------------------------------------------------ */

const DAY_ABR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MON_ABR = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function dayAbbr(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return DAY_ABR[new Date(y, m - 1, d).getDay()];
}
function dayNum(iso: string) { return parseInt(iso.split('-')[2]); }
function monAbbr(iso: string) { return MON_ABR[parseInt(iso.split('-')[1]) - 1]; }
function getToday() { return new Date().toISOString().split('T')[0]; }

// Returns Mon-Sun (7 days) of the ISO week that contains the given date
function getMonSunWeek(iso: string): string[] {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dow = date.getDay(); // 0=Sun … 6=Sat
  const toMon = dow === 0 ? 6 : dow - 1;
  const monday = new Date(date);
  monday.setDate(d - toMon);
  return Array.from({ length: 7 }, (_, i) => {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    return cur.toISOString().split('T')[0];
  });
}

/* ------------------------------------------------------------------ */
/* SUB-COMPONENTS                                                      */
/* ------------------------------------------------------------------ */

function Chip({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 9, fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color, background: bg, borderRadius: 3, padding: '3px 7px',
    }}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

export default function AgendaPage() {
  const [requests, setRequests] = useState<ScheduleReq[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const rounds = useMemo(() => buildRounds(), []);
  const today  = getToday();

  const [roundIdx, setRoundIdx] = useState(() => {
    const cur = rounds.findIndex(r => r.start <= today && today <= r.end);
    if (cur !== -1) return cur;
    const next = rounds.findIndex(r => r.start > today);
    return next !== -1 ? next : Math.max(0, rounds.length - 1);
  });

  const round = rounds[roundIdx];

  useEffect(() => {
    fetch('/api/agenda')
      .then(r => r.json())
      .then((data: ScheduleReq[]) => { setRequests(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const reqByMatch = useMemo(() => {
    const m = new Map<string, ScheduleReq>();
    requests.forEach(r => m.set(r.matchId, r));
    return m;
  }, [requests]);

  // Which days in this round have a confirmed or pending schedule request
  const scheduledDays = useMemo(() => {
    const days = new Set<string>();
    round?.matches.forEach(m => {
      const req = reqByMatch.get(m.matchId);
      if (req) days.add(req.date);
    });
    return days;
  }, [round, reqByMatch]);

  // Matches to show: if a day is selected, only those with a req on that day; else all
  const visibleMatches = useMemo(() => {
    if (!round) return [];
    if (!selectedDay) return [...round.matches].sort((a, b) => {
      const ra = reqByMatch.get(a.matchId);
      const rb = reqByMatch.get(b.matchId);
      const rank = (m: MatchEntry, r?: ScheduleReq) =>
        m.played ? 3 : r?.status === 'confirmed' ? 0 : r?.status === 'pending' ? 1 : 2;
      return rank(a, ra) - rank(b, rb);
    });
    return round.matches.filter(m => reqByMatch.get(m.matchId)?.date === selectedDay);
  }, [round, selectedDay, reqByMatch]);

  if (!round) return null;

  const rangeLabel = round.weekDays.length === 1
    ? `${dayNum(round.start)} ${monAbbr(round.start)}`
    : `${dayNum(round.start)} ${monAbbr(round.start)} – ${dayNum(round.end)} ${monAbbr(round.end)}`;

  return (
    <>
      <TitleBar title="Agenda" meta="Partidas agendadas · QG Open" />
      <div className="page">

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', marginBottom: 4 }}>
            Agenda
          </div>
          <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--qg-fg-1)' }}>
            Partidas
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>

          {/* Round nav header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 8px 10px 8px',
            background: 'var(--qg-green)',
          }}>
            <button
              onClick={() => { setRoundIdx(i => Math.max(0, i - 1)); setSelectedDay(null); }}
              disabled={roundIdx === 0}
              style={{
                background: 'none', border: 'none', padding: '4px 12px',
                cursor: roundIdx === 0 ? 'default' : 'pointer',
                color: roundIdx === 0 ? 'rgba(234,241,236,0.25)' : 'var(--qg-cream)',
                fontSize: 20, lineHeight: 1,
              }}
            >‹</button>

            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--qg-cream)' }}>
                {round.phaseName}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(234,241,236,0.65)', marginTop: 2, letterSpacing: '0.04em' }}>
                {rangeLabel}
              </div>
            </div>

            <button
              onClick={() => { setRoundIdx(i => Math.min(rounds.length - 1, i + 1)); setSelectedDay(null); }}
              disabled={roundIdx === rounds.length - 1}
              style={{
                background: 'none', border: 'none', padding: '4px 12px',
                cursor: roundIdx === rounds.length - 1 ? 'default' : 'pointer',
                color: roundIdx === rounds.length - 1 ? 'rgba(234,241,236,0.25)' : 'var(--qg-cream)',
                fontSize: 20, lineHeight: 1,
              }}
            >›</button>
          </div>

          {/* 7-day calendar strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${round.weekDays.length}, 1fr)`,
            borderBottom: '1px solid var(--qg-line)',
            background: '#fff',
          }}>
            {round.weekDays.map((day, i) => {
              const isToday    = day === today;
              const hasMatch   = scheduledDays.has(day);
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '10px 4px 8px',
                    background: isSelected ? 'var(--qg-green)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    borderRight: i < round.weekDays.length - 1 ? '1px solid var(--qg-line)' : 'none',
                    transition: 'background 120ms',
                  }}
                >
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: isSelected ? 'rgba(234,241,236,0.75)' : isToday ? 'var(--qg-clay)' : 'var(--qg-fg-3)',
                    marginBottom: 4,
                  }}>
                    {dayAbbr(day)}
                  </span>
                  <span style={{
                    fontFamily: 'var(--qg-font-display)', fontSize: 17, fontWeight: 700, lineHeight: 1,
                    color: isSelected ? '#fff' : isToday ? 'var(--qg-clay)' : 'var(--qg-fg-1)',
                  }}>
                    {dayNum(day)}
                  </span>
                  <div style={{
                    marginTop: 5, width: 5, height: 5, borderRadius: '50%',
                    background: hasMatch
                      ? isSelected ? 'rgba(255,255,255,0.7)' : 'var(--qg-green)'
                      : 'transparent',
                  }} />
                </button>
              );
            })}
          </div>

          {/* Filter clear */}
          {selectedDay && (
            <div style={{
              padding: '8px 20px', background: 'rgba(5,96,60,0.05)',
              borderBottom: '1px solid var(--qg-line)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, color: 'var(--qg-green)', fontWeight: 600 }}>
                {formatDate(selectedDay)}
              </span>
              <button
                onClick={() => setSelectedDay(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--qg-fg-3)', padding: '2px 6px' }}
              >
                Ver tudo ×
              </button>
            </div>
          )}

          {/* Match list */}
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--qg-fg-3)', fontSize: 13 }}>
              Carregando...
            </div>
          ) : visibleMatches.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--qg-fg-3)' }}>
                Nenhuma partida agendada neste dia.
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--qg-green)', fontWeight: 600 }}
              >
                Ver todas as partidas da rodada →
              </button>
            </div>
          ) : (
            visibleMatches.map((m, i) => {
              const req    = reqByMatch.get(m.matchId);
              const isLast = i === visibleMatches.length - 1;

              return (
                <Link
                  key={m.matchId}
                  href={`/agendar/${m.matchId}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 20px',
                    borderBottom: isLast ? 'none' : '1px solid var(--qg-line)',
                    textDecoration: 'none',
                    background: '#fff',
                    opacity: m.played ? 0.45 : 1,
                    pointerEvents: m.played ? 'none' : 'auto',
                  }}
                >
                  {/* Status */}
                  <div style={{ flexShrink: 0, width: 80 }}>
                    {m.played ? (
                      <Chip color="var(--qg-fg-3)" bg="rgba(0,0,0,0.06)">Encerrada</Chip>
                    ) : req?.status === 'confirmed' ? (
                      <>
                        <Chip color="var(--qg-green)" bg="rgba(5,96,60,0.1)">Confirmada</Chip>
                        <div style={{ fontSize: 10, color: 'var(--qg-fg-3)', marginTop: 4, lineHeight: 1.4 }}>
                          {formatDate(req.date)}<br />{req.startTime}–{req.endTime}
                        </div>
                      </>
                    ) : req?.status === 'pending' ? (
                      <>
                        <Chip color="var(--qg-clay)" bg="rgba(211,82,32,0.1)">Pendente</Chip>
                        <div style={{ fontSize: 10, color: 'var(--qg-fg-3)', marginTop: 4, lineHeight: 1.4 }}>
                          {formatDate(req.date)}<br />{req.startTime}–{req.endTime}
                        </div>
                      </>
                    ) : (
                      <Chip color="var(--qg-fg-3)" bg="rgba(0,0,0,0.05)">A agendar</Chip>
                    )}
                  </div>

                  {/* Match info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', marginBottom: 3 }}>
                      {m.roundLabel}
                    </div>
                    <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 14, fontWeight: 700, color: 'var(--qg-fg-1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {m.p1} × {m.p2}
                    </div>
                  </div>

                  {/* Arrow */}
                  {!m.played && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--qg-fg-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </Link>
              );
            })
          )}
        </div>

      </div>
      <Footer />
    </>
  );
}
