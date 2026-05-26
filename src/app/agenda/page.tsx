'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
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
  id: string; matchId: string;
  fromPlayer: string; toPlayer: string;
  date: string; startTime: string; endTime: string;
  status: string;
};

type MatchEntry = {
  matchId: string; roundLabel: string;
  p1: string; p2: string; played: boolean;
};

type RoundData = {
  dates: string; start: string; end: string;
  phaseName: string; weekDays: string[]; matches: MatchEntry[];
};

/* ------------------------------------------------------------------ */
/* DATA BUILDING                                                       */
/* ------------------------------------------------------------------ */

function derivePhaseName(labels: string[]): string {
  const first = labels.find(Boolean) ?? '';
  if (/Rodada/.test(first)) return `${first} · Fase de Grupos`;
  if (/Quarta/.test(first)) return 'Quartas de Final';
  if (/Semi/.test(first)) return 'Semi-Final';
  return 'Finais';
}

function getMonSunWeek(iso: string): string[] {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dow  = date.getDay();
  const toMon = dow === 0 ? 6 : dow - 1;
  const monday = new Date(date);
  monday.setDate(d - toMon);
  return Array.from({ length: 7 }, (_, i) => {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    return cur.toISOString().split('T')[0];
  });
}

function buildRounds(): RoundData[] {
  const activeEd = editions.find(e => e.status === 'active');
  if (!activeEd) return [];
  const byDates = new Map<string, MatchEntry[]>();
  const push = (dates: string, entry: MatchEntry) => {
    if (!byDates.has(dates)) byDates.set(dates, []);
    byDates.get(dates)!.push(entry);
  };
  Object.values(groupMatchesByEdition[activeEd.id] ?? {}).forEach(ms =>
    ms.forEach(m => push(m.dates, { matchId: m.id, roundLabel: m.round, p1: m.p1.name, p2: m.p2.name, played: m.winner !== undefined }))
  );
  [
    ...mainBracketE2.flatMap(c => c.matches),
    ...consolationBracketE2.filter(c => !c.ghost).flatMap(c => c.matches),
    bronzeE2, consolationBronzeE2,
  ].forEach(m => push(m.dates, { matchId: m.id, roundLabel: m.round, p1: m.p1.name, p2: m.p2.name, played: !!(m.p1.w || m.p2.w) }));
  return [...byDates.entries()]
    .map(([dates, matches]) => {
      const win = parseMatchWindow(dates);
      const start = win[0], end = win[win.length - 1];
      return { dates, start, end, phaseName: derivePhaseName(matches.map(m => m.roundLabel)), weekDays: getMonSunWeek(start), matches };
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

/* ------------------------------------------------------------------ */
/* DATE HELPERS                                                        */
/* ------------------------------------------------------------------ */

const DAY_ABR  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MON_ABR  = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
function dayAbbr(iso: string) { const [y,m,d]=iso.split('-').map(Number); return DAY_ABR[new Date(y,m-1,d).getDay()]; }
function dayNum(iso: string)  { return parseInt(iso.split('-')[2]); }
function monAbbr(iso: string) { return MON_ABR[parseInt(iso.split('-')[1])-1]; }
function getToday()           { return new Date().toISOString().split('T')[0]; }
function parseHour(t: string) { return parseInt(t.split(':')[0]); }

/* ------------------------------------------------------------------ */
/* CONSTANTS                                                           */
/* ------------------------------------------------------------------ */

const H_START = 7;
const H_END   = 23;  // exclusive
const ROW_H   = 60;  // px per hour
const TIME_W  = 44;  // px for time label column

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

export default function AgendaPage() {
  const [requests, setRequests] = useState<ScheduleReq[]>([]);
  const [loading, setLoading]   = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rounds = useMemo(() => buildRounds(), []);
  const today  = getToday();

  const [roundIdx, setRoundIdx] = useState(() => {
    const cur  = rounds.findIndex(r => r.start <= today && today <= r.end);
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

  // Scroll to 18:00 on first render
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (18 - H_START) * ROW_H - 20;
    }
  }, []);

  const reqByMatch = useMemo(() => {
    const map = new Map<string, ScheduleReq>();
    requests.forEach(r => map.set(r.matchId, r));
    return map;
  }, [requests]);

  if (!round) return null;

  const hours = Array.from({ length: H_END - H_START }, (_, i) => H_START + i);

  // Classify matches
  const scheduled   = round.matches.filter(m => { const r = reqByMatch.get(m.matchId); return r && round.weekDays.includes(r.date); });
  const unscheduled = round.matches.filter(m => !m.played && !reqByMatch.has(m.matchId));
  const played      = round.matches.filter(m => m.played);
  const pending     = round.matches.filter(m => { const r = reqByMatch.get(m.matchId); return r?.status === 'pending'; });

  const rangeLabel = round.weekDays.length === 1
    ? `${dayNum(round.start)} ${monAbbr(round.start)}`
    : `${dayNum(round.start)} ${monAbbr(round.start)} – ${dayNum(round.end)} ${monAbbr(round.end)}`;

  return (
    <>
      <TitleBar title="Agenda" meta="Partidas agendadas · QG Open" />
      <div className="page">

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', marginBottom: 4 }}>Agenda</div>
          <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--qg-fg-1)' }}>Partidas</div>
        </div>

        {/* Calendar card */}
        <div className="card" style={{ overflow: 'hidden' }}>

          {/* Round nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 8px', background: 'var(--qg-green)' }}>
            <button onClick={() => setRoundIdx(i => Math.max(0, i-1))} disabled={roundIdx === 0}
              style={{ background: 'none', border: 'none', padding: '4px 12px', cursor: roundIdx === 0 ? 'default' : 'pointer', color: roundIdx === 0 ? 'rgba(234,241,236,0.25)' : 'var(--qg-cream)', fontSize: 22, lineHeight: 1 }}>‹</button>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--qg-cream)' }}>{round.phaseName}</div>
              <div style={{ fontSize: 11, color: 'rgba(234,241,236,0.65)', marginTop: 2, letterSpacing: '0.04em' }}>{rangeLabel}</div>
            </div>
            <button onClick={() => setRoundIdx(i => Math.min(rounds.length-1, i+1))} disabled={roundIdx === rounds.length-1}
              style={{ background: 'none', border: 'none', padding: '4px 12px', cursor: roundIdx === rounds.length-1 ? 'default' : 'pointer', color: roundIdx === rounds.length-1 ? 'rgba(234,241,236,0.25)' : 'var(--qg-cream)', fontSize: 22, lineHeight: 1 }}>›</button>
          </div>

          {/* Day headers — sticky */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--qg-line)', background: '#fff', position: 'sticky', top: 0, zIndex: 3 }}>
            <div style={{ width: TIME_W, flexShrink: 0 }} />
            {round.weekDays.map((day, i) => {
              const isPast      = day < today;
              const outOfWin    = day < round.start || day > round.end;
              const isToday     = day === today;
              const muted       = isPast || outOfWin;
              return (
                <div key={day} style={{
                  flex: 1, textAlign: 'center', padding: '8px 2px',
                  borderLeft: '1px solid var(--qg-line)',
                  opacity: muted ? 0.4 : 1,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isToday ? 'var(--qg-clay)' : 'var(--qg-fg-3)' }}>
                    {dayAbbr(day)}
                  </div>
                  <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 20, fontWeight: 700, lineHeight: 1.1, color: isToday ? 'var(--qg-clay)' : 'var(--qg-fg-1)', marginTop: 2 }}>
                    {dayNum(day)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unscheduled / played chips row */}
          {(unscheduled.length > 0 || played.length > 0 || pending.length > 0) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, borderBottom: '1px solid var(--qg-line)', background: 'rgba(0,0,0,0.015)', minHeight: 36 }}>
              <div style={{ width: TIME_W, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 6 }}>
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--qg-fg-4)' }}>sem hora</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 5, padding: '6px 8px', borderLeft: '1px solid var(--qg-line)' }}>
                {unscheduled.map(m => (
                  <Link key={m.matchId} href={`/agendar/${m.matchId}`} style={{
                    display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
                    padding: '4px 9px', borderRadius: 4, textDecoration: 'none',
                    background: 'rgba(0,0,0,0.05)', border: '1px solid var(--qg-line)',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--qg-fg-1)' }}>
                      {m.p1.split(' ')[0]} × {m.p2.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: 8, color: 'var(--qg-fg-3)', letterSpacing: '0.04em' }}>{m.roundLabel}</span>
                  </Link>
                ))}
                {played.map(m => (
                  <div key={m.matchId} style={{
                    display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
                    padding: '4px 9px', borderRadius: 4,
                    background: 'transparent', border: '1px solid var(--qg-line)',
                    opacity: 0.4,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--qg-fg-2)' }}>
                      {m.p1.split(' ')[0]} × {m.p2.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: 8, color: 'var(--qg-fg-3)', letterSpacing: '0.04em' }}>Encerrada</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scrollable time grid */}
          <div ref={scrollRef} style={{ overflowY: 'auto', overflowX: 'auto', maxHeight: '62vh' }}>
            <div style={{ display: 'flex', minWidth: 420, position: 'relative' }}>

              {/* Time labels */}
              <div style={{ width: TIME_W, flexShrink: 0, position: 'relative' }}>
                {hours.map(h => (
                  <div key={h} style={{
                    height: ROW_H,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                    paddingRight: 8, paddingTop: 4,
                    fontSize: 10, color: 'var(--qg-fg-3)',
                    borderTop: '1px solid var(--qg-line)',
                  }}>
                    {String(h).padStart(2,'0')}h
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {round.weekDays.map(day => {
                const isPast   = day < today;
                const outOfWin = day < round.start || day > round.end;
                const muted    = isPast || outOfWin;

                const dayEvents = round.matches
                  .map(m => ({ match: m, req: reqByMatch.get(m.matchId) }))
                  .filter(({ req }) => req?.date === day);

                return (
                  <div key={day} style={{
                    flex: 1, minWidth: 64,
                    position: 'relative',
                    height: hours.length * ROW_H,
                    borderLeft: '1px solid var(--qg-line)',
                  }}>
                    {/* Hour cells */}
                    {hours.map(h => (
                      <div key={h} style={{
                        position: 'absolute',
                        top: (h - H_START) * ROW_H, left: 0, right: 0,
                        height: ROW_H,
                        borderTop: '1px solid var(--qg-line)',
                        background: muted ? 'rgba(0,0,0,0.022)' : 'transparent',
                      }} />
                    ))}

                    {/* Event cards */}
                    {dayEvents.map(({ match, req }) => {
                      if (!req) return null;
                      const sh = parseHour(req.startTime);
                      const eh = parseHour(req.endTime);
                      if (sh < H_START || eh > H_END) return null;
                      const top    = (sh - H_START) * ROW_H + 2;
                      const height = (eh - sh) * ROW_H - 4;
                      const isConf = req.status === 'confirmed';
                      const color  = isConf ? 'var(--qg-green)'              : 'var(--qg-clay)';
                      const bg     = isConf ? 'rgba(5,96,60,0.12)'           : 'rgba(211,82,32,0.12)';
                      const border = isConf ? 'var(--qg-green)'              : 'var(--qg-clay)';

                      return (
                        <Link key={match.matchId} href={`/agendar/${match.matchId}`} style={{
                          position: 'absolute', top, left: 3, right: 3, height,
                          background: bg,
                          borderLeft: `3px solid ${border}`,
                          borderRadius: 4,
                          padding: '4px 6px',
                          overflow: 'hidden',
                          textDecoration: 'none',
                          zIndex: 2,
                          display: 'flex', flexDirection: 'column',
                        }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: '0.04em', lineHeight: 1 }}>
                            {req.startTime}–{req.endTime}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--qg-fg-1)', marginTop: 3, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {match.p1.split(' ')[0]} × {match.p2.split(' ')[0]}
                          </span>
                          {height >= 80 && (
                            <span style={{ fontSize: 9, color: 'var(--qg-fg-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {match.roundLabel}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}
