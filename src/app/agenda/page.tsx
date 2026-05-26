'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TitleBar from '@/components/TitleBar';
import Footer from '@/components/Footer';
import { getBracketMatch } from '@/lib/schedule';
import { groupMatchesByEdition, editions } from '@/lib/data';
import { formatDate } from '@/lib/schedule';

type ScheduleRequest = {
  id: string;
  matchId: string;
  fromPlayer: string;
  toPlayer: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
};

type MatchInfo = {
  round: string;
  p1: string;
  p2: string;
};

function getMatchInfo(matchId: string): MatchInfo | null {
  // Bracket matches
  const bm = getBracketMatch(matchId);
  if (bm) {
    return { round: bm.round, p1: bm.p1.name, p2: bm.p2.name };
  }
  // Group matches
  for (const ed of editions) {
    const edGroups = groupMatchesByEdition[ed.id];
    if (!edGroups) continue;
    for (const [, matches] of Object.entries(edGroups)) {
      const m = matches.find(gm => gm.id === matchId);
      if (m) return { round: m.round, p1: m.p1.name, p2: m.p2.name };
    }
  }
  return null;
}

function groupByDate(requests: ScheduleRequest[]): Map<string, ScheduleRequest[]> {
  const map = new Map<string, ScheduleRequest[]>();
  for (const r of requests) {
    const list = map.get(r.date) ?? [];
    list.push(r);
    map.set(r.date, list);
  }
  return map;
}

export default function AgendaPage() {
  const [requests, setRequests] = useState<ScheduleRequest[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/agenda')
      .then(r => r.json())
      .then(data => { setRequests(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const confirmed = requests.filter(r => r.status === 'confirmed');
  const pending   = requests.filter(r => r.status === 'pending');
  const grouped   = groupByDate(confirmed);
  const dates     = [...grouped.keys()].sort();

  return (
    <>
      <TitleBar title="Agenda" meta="Partidas agendadas · QG Open" />
      <div className="page">

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', marginBottom: 4 }}>
            Agenda
          </div>
          <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--qg-fg-1)' }}>
            Partidas
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--qg-fg-3)', fontSize: 14 }}>
            Carregando...
          </div>
        ) : confirmed.length === 0 && pending.length === 0 ? (
          <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--qg-fg-3)' }}>Nenhuma partida agendada ainda.</div>
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--qg-fg-4)' }}>
              As partidas confirmadas aparecerão aqui assim que os jogadores combinarem o horário.
            </div>
          </div>
        ) : (
          <>
            {/* Confirmed matches grouped by date */}
            {dates.length > 0 && (
              <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
                <div style={{
                  padding: '10px 20px',
                  background: 'var(--qg-green)',
                  borderBottom: '1px solid rgba(255,255,255,0.12)',
                  fontFamily: 'var(--qg-font-display)', fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--qg-cream)',
                }}>
                  Confirmadas
                </div>

                {dates.map((date, di) => {
                  const dayMatches = grouped.get(date)!;
                  return (
                    <div key={date}>
                      {/* Date header */}
                      <div style={{
                        padding: '8px 20px',
                        background: '#05603C',
                        borderBottom: '1px solid rgba(255,255,255,0.12)',
                        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: 'var(--qg-cream)',
                      }}>
                        {formatDate(date)}
                      </div>

                      {dayMatches.map((req, i) => {
                        const info = getMatchInfo(req.matchId);
                        const isLast = i === dayMatches.length - 1 && di === dates.length - 1;
                        return (
                          <Link
                            key={req.id}
                            href={`/agendar/${req.matchId}`}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 16,
                              padding: '14px 20px',
                              borderBottom: isLast ? 'none' : '1px solid var(--qg-line)',
                              textDecoration: 'none',
                              background: '#fff',
                            }}
                          >
                            {/* Time */}
                            <div style={{
                              flexShrink: 0, minWidth: 80,
                              fontFamily: 'var(--qg-font-display)', fontSize: 15, fontWeight: 700,
                              color: 'var(--qg-green)', letterSpacing: '0.04em',
                            }}>
                              {req.startTime} – {req.endTime}
                            </div>

                            {/* Match info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {info && (
                                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', marginBottom: 3 }}>
                                  {info.round}
                                </div>
                              )}
                              <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 14, fontWeight: 700, color: 'var(--qg-fg-1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {info ? `${info.p1} × ${info.p2}` : `${req.fromPlayer} × ${req.toPlayer}`}
                              </div>
                            </div>

                            {/* Status chip */}
                            <div style={{
                              flexShrink: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                              textTransform: 'uppercase', color: 'var(--qg-green)',
                              background: 'rgba(5,96,60,0.1)', borderRadius: 3,
                              padding: '3px 8px',
                            }}>
                              Confirmada
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pending matches */}
            {pending.length > 0 && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{
                  padding: '10px 20px',
                  background: 'var(--qg-green)',
                  borderBottom: '1px solid rgba(255,255,255,0.12)',
                  fontFamily: 'var(--qg-font-display)', fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--qg-cream)',
                }}>
                  Aguardando confirmação
                </div>

                {pending.map((req, i) => {
                  const info = getMatchInfo(req.matchId);
                  return (
                    <Link
                      key={req.id}
                      href={`/agendar/${req.matchId}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '14px 20px',
                        borderBottom: i < pending.length - 1 ? '1px solid var(--qg-line)' : 'none',
                        textDecoration: 'none',
                        background: '#fff',
                      }}
                    >
                      {/* Date + time */}
                      <div style={{ flexShrink: 0, minWidth: 80 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--qg-fg-3)', marginBottom: 2 }}>
                          {formatDate(req.date)}
                        </div>
                        <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 14, fontWeight: 700, color: 'var(--qg-clay)', letterSpacing: '0.04em' }}>
                          {req.startTime} – {req.endTime}
                        </div>
                      </div>

                      {/* Match info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {info && (
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', marginBottom: 3 }}>
                            {info.round}
                          </div>
                        )}
                        <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 14, fontWeight: 700, color: 'var(--qg-fg-1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {info ? `${info.p1} × ${info.p2}` : `${req.fromPlayer} × ${req.toPlayer}`}
                        </div>
                      </div>

                      {/* Status chip */}
                      <div style={{
                        flexShrink: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: 'var(--qg-clay)',
                        background: 'rgba(211,82,32,0.1)', borderRadius: 3,
                        padding: '3px 8px',
                      }}>
                        Pendente
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
