'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  location: string | null;
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
  if (/Semi/.test(first))   return 'Semi-Final';
  return 'Finais';
}

function getMonSunWeek(iso: string): string[] {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dow  = date.getDay();
  const toMon = dow === 0 ? 6 : dow - 1;
  const mon = new Date(date);
  mon.setDate(d - toMon);
  return Array.from({ length: 7 }, (_, i) => {
    const c = new Date(mon); c.setDate(mon.getDate() + i);
    return c.toISOString().split('T')[0];
  });
}

function buildRounds(): RoundData[] {
  const activeEd = editions.find(e => e.status === 'active');
  if (!activeEd) return [];
  const byDates = new Map<string, MatchEntry[]>();
  const push = (dates: string, e: MatchEntry) => {
    if (!byDates.has(dates)) byDates.set(dates, []);
    byDates.get(dates)!.push(e);
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
      const win   = parseMatchWindow(dates);
      const start = win[0], end = win[win.length - 1];
      return { dates, start, end, phaseName: derivePhaseName(matches.map(m => m.roundLabel)), weekDays: getMonSunWeek(start), matches };
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

const DAY_ABR = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MON_ABR = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
function dayAbbr(iso: string)  { const [y,m,d]=iso.split('-').map(Number); return DAY_ABR[new Date(y,m-1,d).getDay()]; }
function dayNum(iso: string)   { return parseInt(iso.split('-')[2]); }
function monAbbr(iso: string)  { return MON_ABR[parseInt(iso.split('-')[1])-1]; }
function getToday()            { return new Date().toISOString().split('T')[0]; }
function parseHour(t: string)  { return parseInt(t.split(':')[0]); }

const H_START  = 7;
const H_END    = 23;
const ROW_H    = 52;   // px per hour in the calendar grid
const TIME_W   = 40;   // px for time labels column

/* ------------------------------------------------------------------ */
/* MATCH CARD (outside calendar)                                       */
/* ------------------------------------------------------------------ */

function MatchCard({ match, req }: { match: MatchEntry; req?: ScheduleReq }) {
  const isConfirmed = req?.status === 'confirmed';
  const isPending   = req?.status === 'pending';
  const accentColor = match.played
    ? 'var(--qg-fg-3)'
    : isConfirmed ? 'var(--qg-green)'
    : isPending   ? 'var(--qg-clay)'
    : 'var(--qg-line)';

  const inner = (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: 'var(--qg-radius-md)',
      border: '1px solid var(--qg-line)',
      background: '#fff',
      opacity: match.played ? 0.5 : 1,
    }}>
      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accentColor }} />

      <div style={{ padding: '16px 20px 16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Status + time */}
        <div style={{ flexShrink: 0, minWidth: 96 }}>
          {match.played ? (
            <StatusChip color="var(--qg-fg-3)" bg="rgba(0,0,0,0.06)">Encerrada</StatusChip>
          ) : isConfirmed ? (
            <>
              <StatusChip color="var(--qg-green)" bg="rgba(5,96,60,0.1)">Confirmada</StatusChip>
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--qg-fg-2)', lineHeight: 1.5, fontWeight: 500 }}>
                {formatDate(req!.date)}<br />
                <span style={{ fontFamily: 'var(--qg-font-display)', fontWeight: 700, fontSize: 13, color: 'var(--qg-green)' }}>
                  {req!.startTime}–{req!.endTime}
                </span>
              </div>
              {req!.location && (
                <div style={{ marginTop: 4, fontSize: 11, color: 'var(--qg-fg-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {req!.location}
                </div>
              )}
            </>
          ) : isPending ? (
            <>
              <StatusChip color="var(--qg-clay)" bg="rgba(211,82,32,0.1)">Pendente</StatusChip>
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--qg-fg-2)', lineHeight: 1.5, fontWeight: 500 }}>
                {formatDate(req!.date)}<br />
                <span style={{ fontFamily: 'var(--qg-font-display)', fontWeight: 700, fontSize: 13, color: 'var(--qg-clay)' }}>
                  {req!.startTime}–{req!.endTime}
                </span>
              </div>
              {req!.location && (
                <div style={{ marginTop: 4, fontSize: 11, color: 'var(--qg-fg-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {req!.location}
                </div>
              )}
            </>
          ) : (
            <StatusChip color="var(--qg-fg-3)" bg="rgba(0,0,0,0.05)">A agendar</StatusChip>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--qg-line)', flexShrink: 0 }} />

        {/* Match info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', marginBottom: 6 }}>
            {match.roundLabel}
          </div>
          <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 17, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--qg-fg-1)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span>{match.p1}</span>
            <span style={{ fontSize: 12, color: 'var(--qg-fg-3)', fontWeight: 400 }}>×</span>
            <span>{match.p2}</span>
          </div>
        </div>

        {/* Arrow */}
        {!match.played && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--qg-fg-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </div>
    </div>
  );

  if (match.played) return <div key={match.matchId}>{inner}</div>;
  return <Link key={match.matchId} href={`/agendar/${match.matchId}`} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>;
}

function StatusChip({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 9, fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color, background: bg, borderRadius: 3, padding: '3px 8px',
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
  const rounds  = useMemo(() => buildRounds(), []);
  const today   = getToday();

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

  const reqByMatch = useMemo(() => {
    const m = new Map<string, ScheduleReq>();
    requests.forEach(r => m.set(r.matchId, r));
    return m;
  }, [requests]);

  if (!round) return null;

  const hours = Array.from({ length: H_END - H_START }, (_, i) => H_START + i);

  const rangeLabel = round.weekDays.length === 1
    ? `${dayNum(round.start)} ${monAbbr(round.start)}`
    : `${dayNum(round.start)} ${monAbbr(round.start)} – ${dayNum(round.end)} ${monAbbr(round.end)}`;

  // Sort matches: confirmed first (by date), then pending, then unscheduled, then played
  const sortedMatches = [...round.matches].sort((a, b) => {
    const ra = reqByMatch.get(a.matchId), rb = reqByMatch.get(b.matchId);
    const rank = (m: MatchEntry, r?: ScheduleReq) =>
      m.played ? 3 : r?.status === 'confirmed' ? 0 : r?.status === 'pending' ? 1 : 2;
    const ra2 = rank(a, ra), rb2 = rank(b, rb);
    if (ra2 !== rb2) return ra2 - rb2;
    if (ra?.date && rb?.date) return ra.date.localeCompare(rb.date);
    return 0;
  });

  return (
    <>
      <TitleBar title="Agenda" meta="Partidas agendadas · QG Open" />
      <div className="page">

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', marginBottom: 4 }}>Agenda</div>
          <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--qg-fg-1)' }}>Partidas</div>
        </div>

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* LEFT — Calendar grid (fills most of the width) */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            <div className="card" style={{ overflow: 'hidden' }}>

              {/* Round nav */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 8px', background: 'var(--qg-green)' }}>
                <NavBtn onClick={() => setRoundIdx(i => Math.max(0, i-1))} disabled={roundIdx === 0}>‹</NavBtn>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--qg-cream)' }}>{round.phaseName}</div>
                  <div style={{ fontSize: 11, color: 'rgba(234,241,236,0.65)', marginTop: 2, letterSpacing: '0.04em' }}>{rangeLabel}</div>
                </div>
                <NavBtn onClick={() => setRoundIdx(i => Math.min(rounds.length-1, i+1))} disabled={roundIdx === rounds.length-1}>›</NavBtn>
              </div>

              {/* Horizontal scroll for narrow screens */}
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: 320 }}>

                  {/* Day headers */}
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--qg-line)', background: '#fff' }}>
                    <div style={{ width: TIME_W, flexShrink: 0 }} />
                    {round.weekDays.map(day => {
                      const isPast   = day < today;
                      const outOfWin = day < round.start || day > round.end;
                      const isToday  = day === today;
                      return (
                        <div key={day} style={{ flex: 1, textAlign: 'center', padding: '8px 2px', borderLeft: '1px solid var(--qg-line)', opacity: (isPast || outOfWin) ? 0.38 : 1 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isToday ? 'var(--qg-clay)' : 'var(--qg-fg-3)' }}>{dayAbbr(day)}</div>
                          <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 18, fontWeight: 700, lineHeight: 1.1, color: isToday ? 'var(--qg-clay)' : 'var(--qg-fg-1)', marginTop: 2 }}>{dayNum(day)}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Time grid */}
                  <div style={{ display: 'flex', position: 'relative' }}>
                    {/* Time labels */}
                    <div style={{ width: TIME_W, flexShrink: 0 }}>
                      {hours.map(h => (
                        <div key={h} style={{ height: ROW_H, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 4, fontSize: 10, color: 'var(--qg-fg-3)', borderTop: '1px solid var(--qg-line)' }}>
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
                        <div key={day} style={{ flex: 1, minWidth: 36, position: 'relative', borderLeft: '1px solid var(--qg-line)', height: hours.length * ROW_H }}>
                          {hours.map(h => (
                            <div key={h} style={{ position: 'absolute', top: (h-H_START)*ROW_H, left: 0, right: 0, height: ROW_H, borderTop: '1px solid var(--qg-line)', background: muted ? 'rgba(0,0,0,0.025)' : 'transparent' }} />
                          ))}
                          {dayEvents.map(({ match, req }) => {
                            if (!req) return null;
                            const sh = parseHour(req.startTime), eh = parseHour(req.endTime);
                            if (sh < H_START || eh > H_END) return null;
                            const isConf = req.status === 'confirmed';
                            return (
                              <div key={match.matchId} style={{
                                position: 'absolute',
                                top: (sh-H_START)*ROW_H + 2, left: 2, right: 2,
                                height: (eh-sh)*ROW_H - 4,
                                background: isConf ? 'rgba(5,96,60,0.15)' : 'rgba(211,82,32,0.15)',
                                borderLeft: `3px solid ${isConf ? 'var(--qg-green)' : 'var(--qg-clay)'}`,
                                borderRadius: 3, zIndex: 1, overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 4px',
                              }}>
                                <span style={{ fontSize: 9, fontWeight: 700, color: isConf ? 'var(--qg-green)' : 'var(--qg-clay)', lineHeight: 1 }}>
                                  {req.startTime}–{req.endTime}
                                </span>
                                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--qg-fg-1)', marginTop: 2, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {match.p1.split(' ')[0]} × {match.p2.split(' ')[0]}
                                </span>
                                {req.location && (
                                  <span style={{ fontSize: 8, color: 'var(--qg-fg-3)', marginTop: 1, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {req.location}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Match cards (sticky sidebar) */}
          <div style={{ flex: '0 0 300px', minWidth: 0, position: 'sticky', top: 76, maxHeight: 'calc(100vh - 96px)', overflowY: 'auto', paddingBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', marginBottom: 14 }}>
              Partidas desta rodada
            </div>
            {loading ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--qg-fg-3)', fontSize: 13 }}>Carregando...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sortedMatches.map(m => (
                  <MatchCard key={m.matchId} match={m} req={reqByMatch.get(m.matchId)} />
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
      <Footer />
    </>
  );
}

function NavBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: 'none', border: 'none', padding: '4px 12px',
      cursor: disabled ? 'default' : 'pointer',
      color: disabled ? 'rgba(234,241,236,0.25)' : 'var(--qg-cream)',
      fontSize: 22, lineHeight: 1,
    }}>{children}</button>
  );
}
