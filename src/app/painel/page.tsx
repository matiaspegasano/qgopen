'use client';

import { useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import EditionMultiDropdown from '@/components/EditionMultiDropdown';
import { useSession, signIn } from 'next-auth/react';
import {
  editions, editionPoints, games,
  groupMatchesByEdition,
  mainBracket, consolationBracket, bronzeMatch,
  mainBracketE2, consolationBracketE2, bronzeE2, consolationBronzeE2,
  type BracketMatch, type GroupMatch,
} from '@/lib/data';
import { computeWinsLosses } from '@/lib/stats';

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

type MatchRow = { round: string; phase: string; opponent: string; seed: number; won: number; lost: number; score: string };

function buildMatchHistory(playerName: string, editionId: number): MatchRow[] {
  const edGames = games.filter(g =>
    g.edition === editionId && (g.p1 === playerName || g.p2 === playerName) && !g.wo
  );
  const allGroupMs = Object.values(groupMatchesByEdition[editionId] ?? {}).flat() as GroupMatch[];
  const bracketMs: BracketMatch[] = editionId === 1
    ? [...mainBracket.flatMap(c => c.matches), ...consolationBracket.filter(c => !c.ghost).flatMap(c => c.matches), bronzeMatch]
    : [...mainBracketE2.flatMap(c => c.matches), ...consolationBracketE2.filter(c => !c.ghost).flatMap(c => c.matches), bronzeE2, consolationBronzeE2];

  return edGames.map(g => {
    const matIsP1 = g.p1 === playerName;
    const opponent = matIsP1 ? g.p2 : g.p1;
    const stats = parseGameStats(g.result, matIsP1);
    if (!stats) return null;

    const gm = allGroupMs.find(m => m.id === g.id);
    const bm = bracketMs.find(m => m.id === g.id);
    let seed = 0;
    if (gm) seed = matIsP1 ? gm.p2.seed : gm.p1.seed;
    else if (bm) seed = matIsP1 ? bm.p2.seed : bm.p1.seed;

    let phase = 'Outro';
    if (g.phase === 'Fase de Grupos') phase = g.round.split('— ')[1] ?? 'Grupos';
    else if (g.phase === 'Quartas de Final') phase = 'Quartas';
    else if (g.phase === 'Semifinais') phase = 'Semifinal';
    else if (g.phase === 'Finais') phase = 'Final';
    else if (g.phase === 'Chave Consolação') phase = 'Consolação';

    const [roundLabel] = g.round.split(' —');
    return { round: roundLabel.trim(), phase, opponent, seed, won: stats.gamesWon, lost: stats.gamesLost, score: g.result };
  }).filter(Boolean) as MatchRow[];
}

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

const legendItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--qg-fg-3)',
};
const legendDot = (color: string): React.CSSProperties => ({
  width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
});

function parseGameStats(result: string, isP1: boolean): { gamesWon: number; gamesLost: number; setsWon: number; setsLost: number } | null {
  if (!result || result.startsWith('WO')) return null;
  const sets = result.split(', ');
  let gamesWon = 0, gamesLost = 0, setsWon = 0, setsLost = 0;
  for (const set of sets) {
    const clean = set.trim().replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '');
    const [a, b] = clean.split('-').map(Number);
    if (isNaN(a) || isNaN(b)) continue;
    if (isP1) {
      gamesWon += a; gamesLost += b;
      if (a > b) setsWon++; else setsLost++;
    } else {
      gamesWon += b; gamesLost += a;
      if (b > a) setsWon++; else setsLost++;
    }
  }
  return { gamesWon, gamesLost, setsWon, setsLost };
}

const superMap: Record<string, string> = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9' };
function formatSet(set: string): string {
  const s = set.trim();
  if (!/[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(s)) {
    const [a, b] = s.split('-');
    return `${a} - ${b}`;
  }
  const [p1, p2] = s.split('-');
  const p1Main = p1.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '');
  const p1Tb   = p1.replace(/[^⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '').split('').map(c => superMap[c]).join('');
  const p2Main = p2.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '');
  const p2Tb   = p2.replace(/[^⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '').split('').map(c => superMap[c]).join('');
  return `${p1Main} (${p1Tb}) - (${p2Tb}) ${p2Main}`;
}

/* ------------------------------------------------------------------ */
/* COMPONENTS                                                          */
/* ------------------------------------------------------------------ */

function MiniDonut({ winPct }: { winPct: number }) {
  const r = 30, cx = 50, cy = 40;
  const circ = 2 * Math.PI * r;
  const filled = (winPct / 100) * circ;
  return (
    <div>
      <svg viewBox="0 0 100 80" style={{ display: 'block', width: '100%', height: 80 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--qg-clay)" strokeWidth="9" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--qg-green)" strokeWidth="9"
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`} />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
        <div style={legendItemStyle}><div style={legendDot('var(--qg-green)')} />Vitórias</div>
        <div style={legendItemStyle}><div style={legendDot('var(--qg-clay)')} />Derrotas</div>
      </div>
    </div>
  );
}

function WinLossBar({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;
  if (total === 0) return null;
  const winPct = (wins / total) * 100;
  const lossPct = 100 - winPct;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        <div style={{ display: 'flex', height: 20, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
          <div style={{ width: `${winPct}%`, background: 'var(--qg-green)', transition: 'width 400ms' }} />
          {lossPct > 0 && <div style={{ width: `${lossPct}%`, background: 'var(--qg-clay)', boxSizing: 'border-box' as const }} />}
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={legendItemStyle}><div style={legendDot('var(--qg-green)')} />{wins} vitória{wins !== 1 ? 's' : ''}</div>
          <div style={legendItemStyle}><div style={legendDot('var(--qg-clay)')} />{losses} derrota{losses !== 1 ? 's' : ''}</div>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data, invert = false }: {
  data: { label: string; value: number | null }[];
  invert?: boolean;
}) {
  const VW = 300, H = 60, labelH = 18, padX = 16, padY = 10;
  const innerH = H - padY * 2;
  const defined = data.map(d => d.value).filter((v): v is number => v !== null);
  const minV = defined.length ? Math.min(...defined) : 0;
  const maxV = defined.length ? Math.max(...defined) : 1;
  const range = maxV === minV ? 1 : maxV - minV;
  const n = data.length;

  const toX = (i: number) => padX + (n > 1 ? (i / (n - 1)) * (VW - padX * 2) : (VW - padX * 2) / 2);
  const toY = (v: number) => {
    const norm = (v - minV) / range;
    return padY + (invert ? norm : 1 - norm) * innerH;
  };

  const pts = data.map((d, i) => ({ x: toX(i), y: d.value !== null ? toY(d.value) : null, label: d.label }));
  const definedPts = pts.filter(p => p.y !== null) as { x: number; y: number; label: string }[];
  const linePath = definedPts.length > 1
    ? definedPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : null;
  const lastDefined = definedPts[definedPts.length - 1];
  const firstMissing = pts.find((p, i) => p.y === null && i > 0);

  return (
    <svg viewBox={`0 0 ${VW} ${H + labelH}`} style={{ display: 'block', width: '100%', height: H + labelH }}>
      {linePath && (
        <path d={linePath} fill="none" stroke="var(--qg-green)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
      )}
      {lastDefined && firstMissing && (
        <line x1={lastDefined.x} y1={lastDefined.y} x2={firstMissing.x} y2={H / 2}
          stroke="var(--qg-line-strong)" strokeWidth="1.5" strokeDasharray="5 4" />
      )}
      {pts.map((p, i) =>
        p.y !== null
          ? <circle key={i} cx={p.x} cy={p.y} r="5" fill="var(--qg-green)" />
          : <circle key={i} cx={p.x} cy={H / 2} r="4.5" fill="var(--qg-bg-elev)"
              stroke="var(--qg-line-strong)" strokeWidth="1.5" strokeDasharray="3 2" />
      )}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H + labelH - 2} textAnchor="middle"
          fontSize="11" fill="var(--qg-fg-3)" fontFamily="Inter, sans-serif" fontWeight="600"
          letterSpacing="0.5">
          {p.label}
        </text>
      ))}
    </svg>
  );
}

function WinRateDonut({ wins, total }: { wins: number; total: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const filled = total > 0 ? (wins / total) * circ : 0;
  return (
    <svg viewBox="0 0 100 100" width={148} height={148} style={{ display: 'block' }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--qg-green-wash)" strokeWidth="9" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--qg-green)" strokeWidth="9"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="butt"
        transform="rotate(-90 50 50)" />
    </svg>
  );
}

function TournamentPath({ playerName }: { playerName: string }) {
  const history = buildMatchHistory(playerName, 1);
  const groupPhases = [...new Set(history.filter(m => m.phase.startsWith('Grupo')).map(m => m.phase))];
  const phases = [
    { label: 'Fase de Grupos', matches: history.filter(m => m.phase.startsWith('Grupo')) },
    { label: 'Quartas',   matches: history.filter(m => m.phase === 'Quartas')   },
    { label: 'Semi-Final', matches: history.filter(m => m.phase === 'Semifinal') },
    { label: 'Final',     matches: history.filter(m => m.phase === 'Final'),     isFinal: true },
    ...history.some(m => m.phase === 'Consolação') ? [{ label: 'Consolação', matches: history.filter(m => m.phase === 'Consolação'), isFinal: false }] : [],
  ].filter(p => p.matches.length > 0);
  void groupPhases; // used implicitly via phase labels

  return (
    <div className="card">
      <div className="card-header card-header-clay">
        Caminho ao Título
        <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.8, letterSpacing: '0.1em' }}>
          1ª Edição · 2026
        </span>
      </div>
      <div style={{ display: 'flex', width: '100%' }}>
        {phases.map((phase, pi) => (
          <div key={pi} style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: pi < phases.length - 1 ? '1px solid var(--qg-line)' : 'none' }}>
              <div style={{
                padding: '10px 20px 8px',
                fontSize: 10, fontWeight: 600, letterSpacing: '0.14em',
                textTransform: 'uppercase' as const, color: 'var(--qg-fg-3)',
                borderBottom: '1px solid var(--qg-line)',
                flexShrink: 0,
              }}>
                {phase.label}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: (phase as any).isFinal ? 'var(--qg-clay-wash)' : 'var(--qg-bg-elev)' }}>
                {phase.matches.map((m, mi) => (
                  <div key={mi} style={{
                    padding: '16px 20px',
                    borderBottom: mi < phase.matches.length - 1 ? '1px solid var(--qg-line)' : 'none',
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
                      textTransform: 'uppercase' as const,
                      color: (phase as any).isFinal ? 'var(--qg-clay)' : 'var(--qg-fg-3)',
                      marginBottom: 6,
                    }}>
                      {m.round}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--qg-font-display)', fontSize: 18, fontWeight: 700, color: 'var(--qg-fg-1)', textTransform: 'uppercase' as const, letterSpacing: '0.02em' }}>
                        {m.opponent}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--qg-fg-3)' }}>({m.seed})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13, fontWeight: 600, color: 'var(--qg-green)' }}>
                        {m.score}
                      </span>
                      {(phase as any).isFinal && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                          textTransform: 'uppercase' as const,
                          background: 'var(--qg-clay)', color: 'var(--qg-cream)',
                          padding: '2px 6px', borderRadius: 2,
                        }}>
                          Campeão
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {pi < phases.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 2px', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 8h8M8 4l4 4-4 4" stroke="var(--qg-line-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TournamentPath2({ playerName }: { playerName: string }) {
  const myGroupMatches = Object.values(groupMatchesByEdition[2]).flat().filter(
    m => m.p1.name === playerName || m.p2.name === playerName
  );
  const ed2MyGames = games.filter(
    g => g.edition === 2 && (g.p1 === playerName || g.p2 === playerName)
  );

  const groupRows = myGroupMatches.map(m => {
    const matIsP1 = m.p1.name === playerName;
    const opp = matIsP1 ? m.p2 : m.p1;
    const played = m.winner !== undefined;
    const won = played && ((matIsP1 && m.winner === 1) || (!matIsP1 && m.winner === 2));
    const gameEntry = ed2MyGames.find(g => g.id === m.id);
    let result = gameEntry?.result ?? null;
    if (result && !won && gameEntry) {
      result = result.split(', ').map(s => {
        const pts = s.split('-');
        return pts.length === 2 ? `${pts[1]}-${pts[0]}` : s;
      }).join(', ');
    }
    return { round: m.round, opp, played, won, result, dates: m.dates, scheduledAt: (m as any).scheduledAt, location: (m as any).location };
  });

  // Bracket matches already played (QF, SF, Final)
  const bracketHistory = buildMatchHistory(playerName, 2).filter(m => m.phase !== 'Grupos' && !m.phase.startsWith('Grupo'));
  const bracketPhaseOrder = ['Quartas', 'Semifinal', 'Consolação', 'Final'];
  const bracketPhases = bracketPhaseOrder
    .filter(ph => bracketHistory.some(m => m.phase === ph))
    .map(ph => ({ label: ph, rows: bracketHistory.filter(m => m.phase === ph), isFinal: ph === 'Final' }));

  const phases: { label: string; flex: number; groupRows?: typeof groupRows; bracketRows?: typeof bracketHistory; isFinal?: boolean }[] = [
    { label: 'Fase de Grupos', flex: 2, groupRows },
    { label: 'Quartas',    flex: 1, bracketRows: bracketHistory.filter(m => m.phase === 'Quartas') },
    { label: 'Semi-Final', flex: 1, bracketRows: bracketHistory.filter(m => m.phase === 'Semifinal') },
    { label: 'Final',      flex: 1, isFinal: true, bracketRows: bracketHistory.filter(m => m.phase === 'Final') },
    ...bracketPhases.some(p => p.label === 'Consolação')
      ? [{ label: 'Consolação', flex: 1, bracketRows: bracketHistory.filter(m => m.phase === 'Consolação') }]
      : [],
  ]; void bracketPhases;

  // Find a pending (unplayed, both players known) bracket match for a given phase label
  function findPending(phaseLabel: string): BracketMatch | null {
    const colMap: Record<string, number[]> = {
      'Quartas': [0, 4], 'Semi-Final': [1, 3], 'Final': [2],
    };
    for (const col of (colMap[phaseLabel] ?? [])) {
      const colData = mainBracketE2.find(c => c.col === col);
      if (!colData) continue;
      for (const m of colData.matches) {
        if ((m.p1.name === playerName || m.p2.name === playerName) &&
            !m.p1.w && !m.p2.w &&
            m.p1.name !== 'A definir' && m.p2.name !== 'A definir') {
          return m;
        }
      }
    }
    return null;
  }

  return (
    <div className="card">
      <div className="card-header card-header-clay">
        Caminho ao Título
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            background: 'rgba(255,255,255,0.18)', color: 'var(--qg-cream)',
            padding: '2px 6px', borderRadius: 2,
          }}>Em andamento</span>
          <span style={{ fontSize: 11, opacity: 0.8, letterSpacing: '0.1em' }}>
            2ª Edição · 2026
          </span>
        </span>
      </div>

      <div style={{ display: 'flex', width: '100%' }}>
        {phases.map((phase, pi) => {
          const pending = findPending(phase.label);
          return (
          <div key={pi} style={{ display: 'flex', alignItems: 'stretch', flex: phase.flex }}>
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              borderRight: pi < phases.length - 1 ? '1px solid var(--qg-line)' : 'none',
            }}>
              <div style={{
                padding: '10px 20px 8px',
                fontSize: 10, fontWeight: 600, letterSpacing: '0.14em',
                textTransform: 'uppercase' as const, color: 'var(--qg-fg-3)',
                borderBottom: '1px solid var(--qg-line)', flexShrink: 0,
              }}>
                {phase.label}
              </div>

              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                background: phase.isFinal ? 'var(--qg-clay-wash)' : 'var(--qg-bg-elev)',
              }}>
                {phase.groupRows ? (
                  phase.groupRows.map((row, ri) => (
                    <div key={ri} style={{
                      padding: '14px 20px',
                      borderBottom: ri < phase.groupRows!.length - 1 ? '1px solid var(--qg-line)' : 'none',
                      opacity: row.played || row.scheduledAt ? 1 : 0.65,
                    }}>
                      <div style={{
                        fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
                        textTransform: 'uppercase' as const, color: 'var(--qg-fg-3)', marginBottom: 5,
                      }}>
                        {row.round}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                        <span style={{
                          fontFamily: 'var(--qg-font-display)', fontSize: 17, fontWeight: 700,
                          color: row.played ? 'var(--qg-fg-1)' : 'var(--qg-fg-3)',
                          textTransform: 'uppercase' as const, letterSpacing: '0.02em',
                        }}>
                          {row.opp.name}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--qg-fg-4)' }}>({row.opp.seed})</span>
                      </div>
                      {row.played ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontVariantNumeric: 'tabular-nums', fontSize: 12, fontWeight: 600,
                            color: row.won ? 'var(--qg-green)' : 'var(--qg-clay)',
                          }}>
                            {row.result}
                          </span>
                          <span style={{
                            fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
                            textTransform: 'uppercase' as const,
                            background: row.won ? 'var(--qg-green)' : 'var(--qg-clay)',
                            color: 'var(--qg-cream)', padding: '2px 5px', borderRadius: 2,
                          }}>
                            {row.won ? 'V' : 'D'}
                          </span>
                        </div>
                      ) : row.scheduledAt ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{
                            fontSize: 11, fontWeight: 600, color: 'var(--qg-clay)',
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {row.scheduledAt}
                          </div>
                          {row.location && (
                            <div style={{ fontSize: 10, color: 'var(--qg-fg-3)', letterSpacing: '0.02em' }}>
                              {row.location}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: 10, color: 'var(--qg-fg-4)', fontVariantNumeric: 'tabular-nums' }}>
                          {row.dates}
                        </div>
                      )}
                    </div>
                  ))
                ) : phase.bracketRows && phase.bracketRows.length > 0 ? (
                  phase.bracketRows.map((br, bri) => (
                    <div key={bri} style={{ padding: '16px 20px', borderBottom: bri < phase.bracketRows!.length - 1 ? '1px solid var(--qg-line)' : 'none' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--qg-fg-3)', marginBottom: 5 }}>
                        {br.round}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--qg-font-display)', fontSize: 17, fontWeight: 700, color: 'var(--qg-fg-1)', textTransform: 'uppercase' as const, letterSpacing: '0.02em' }}>
                          {br.opponent}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--qg-fg-4)' }}>({br.seed})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12, fontWeight: 600, color: br.won > br.lost ? 'var(--qg-green)' : 'var(--qg-clay)' }}>
                          {br.score}
                        </span>
                        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, background: br.won > br.lost ? 'var(--qg-green)' : 'var(--qg-clay)', color: 'var(--qg-cream)', padding: '2px 5px', borderRadius: 2 }}>
                          {br.won > br.lost ? 'V' : 'D'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : pending ? (
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--qg-fg-3)', marginBottom: 5 }}>
                        {pending.round}
                      </div>
                      <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 15, fontWeight: 700, color: 'var(--qg-fg-1)', textTransform: 'uppercase' as const, letterSpacing: '0.02em' }}>
                        {pending.p1.name === playerName ? pending.p2.name : pending.p1.name}
                      </div>
                    </div>
                    <Link href={`/agendar/${pending.id}`} style={{
                      display: 'inline-flex', alignItems: 'center',
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                      background: 'var(--qg-green)', color: 'var(--qg-cream)',
                      padding: '7px 14px', borderRadius: 'var(--qg-radius-sm)',
                      textDecoration: 'none',
                    }}>
                      Agendar
                    </Link>
                  </div>
                ) : (
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{
                      fontFamily: 'var(--qg-font-display)', fontSize: 13, fontWeight: 700,
                      color: 'var(--qg-fg-4)', textTransform: 'uppercase' as const,
                      letterSpacing: '0.04em', lineHeight: 1,
                    }}>
                      A definir
                    </span>
                    <span style={{
                      alignSelf: 'flex-start',
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase' as const,
                      background: 'var(--qg-line)', color: 'var(--qg-fg-3)',
                      padding: '3px 7px', borderRadius: 2,
                    }}>
                      Em breve
                    </span>
                  </div>
                )}
              </div>
            </div>

            {pi < phases.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 2px', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 8h8M8 4l4 4-4 4" stroke="var(--qg-line-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}

function GamesChart({ matches = [] }: { matches?: MatchRow[] }) {
  const [mode, setMode] = useState<'number' | 'percent'>('number');
  const totalWon  = matches.reduce((s: number, m: MatchRow) => s + m.won,  0);
  const totalLost = matches.reduce((s: number, m: MatchRow) => s + m.lost, 0);
  const fmt = (val: number, rowTotal: number) =>
    mode === 'number' ? String(val) : rowTotal > 0 ? `${Math.round((val / rowTotal) * 100)}%` : '—';

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--qg-cream)' : 'transparent',
    color: active ? 'var(--qg-green-deep)' : 'rgba(234,241,236,0.5)',
    border: 'none', cursor: 'pointer',
    padding: '4px 10px',
    fontFamily: 'var(--qg-font-display)', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.05em', lineHeight: 1,
    transition: 'background 150ms, color 150ms',
  });

  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        Games por Partida
        <div style={{
          marginLeft: 'auto',
          display: 'flex', overflow: 'hidden',
          border: '1px solid rgba(234,241,236,0.25)',
          borderRadius: 'var(--qg-radius-sm)',
        }}>
          <button onClick={() => setMode('number')} style={btnStyle(mode === 'number')} title="Valores absolutos">#</button>
          <button onClick={() => setMode('percent')} style={{ ...btnStyle(mode === 'percent'), borderLeft: '1px solid rgba(234,241,236,0.2)' }} title="Percentuais">%</button>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '140px 1fr 1fr',
        padding: '8px 20px 10px',
        fontSize: 9, fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        borderBottom: '1px solid var(--qg-line)',
        flexShrink: 0,
      }}>
        <div />
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 12, color: 'var(--qg-clay)', borderRight: '1px solid var(--qg-line)' }}>← Perdidos</div>
        <div style={{ paddingLeft: 12, color: 'var(--qg-green)' }}>Ganhos →</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {matches.map((m: MatchRow, i: number) => {
          const rowTotal = m.won + m.lost;
          const wonW  = rowTotal > 0 ? (m.won  / rowTotal) * 100 : 0;
          const lostW = rowTotal > 0 ? (m.lost / rowTotal) * 100 : 0;
          const isFinal = m.phase === 'Final';
          return (
            <div key={i} style={{
              flex: 1,
              display: 'grid', gridTemplateColumns: '140px 1fr 1fr',
              alignItems: 'center',
              padding: '0 20px',
              borderBottom: i < matches.length - 1 ? '1px solid var(--qg-line)' : 'none',
            }}>
              <div style={{ paddingRight: 16 }}>
                <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.02em', color: 'var(--qg-fg-1)', lineHeight: 1.1 }}>{m.opponent}</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginTop: 4, color: isFinal ? 'var(--qg-clay)' : 'var(--qg-fg-3)' }}>{m.round}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, borderRight: '1px solid var(--qg-line)', paddingRight: 12 }}>
                <div style={{ width: `${lostW}%`, height: 20, background: 'var(--qg-clay-wash)', borderLeft: '3px solid var(--qg-clay)', borderRadius: '2px 0 0 2px' }} />
                <span style={{ fontSize: 12, fontWeight: 700, flexShrink: 0, color: m.lost > 0 ? 'var(--qg-clay-deep)' : 'var(--qg-fg-4)', fontVariantNumeric: 'tabular-nums', minWidth: 22, textAlign: 'right' }}>{fmt(m.lost, m.lost + m.won)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 8, paddingLeft: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, flexShrink: 0, color: 'var(--qg-green)', fontVariantNumeric: 'tabular-nums', minWidth: 22, textAlign: 'left' }}>{fmt(m.won, m.lost + m.won)}</span>
                <div style={{ width: `${wonW}%`, height: 20, background: 'var(--qg-green-wash)', borderRight: '3px solid var(--qg-green)', borderRadius: '0 2px 2px 0' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', padding: '14px 20px', borderTop: '2px solid var(--qg-line)', flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--qg-fg-3)', display: 'flex', alignItems: 'center' }}>Total</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderRight: '1px solid var(--qg-line)', paddingRight: 12 }}>
          <span style={{ fontFamily: 'var(--qg-font-display)', fontSize: 24, fontWeight: 700, color: 'var(--qg-clay-deep)', minWidth: 22, textAlign: 'right' }}>{fmt(totalLost, totalWon + totalLost)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
          <span style={{ fontFamily: 'var(--qg-font-display)', fontSize: 24, fontWeight: 700, color: 'var(--qg-green)', minWidth: 22 }}>{fmt(totalWon, totalWon + totalLost)}</span>
        </div>
      </div>
    </div>
  );
}

function SetSummaryBar({ sets: setsProp }: { sets?: { phase: string; won: number; lost: number }[] } = {}) {
  const sets = setsProp ?? [
    { phase: 'Grupo A', won: 4, lost: 0 },
    { phase: 'Quartas', won: 2, lost: 0 },
    { phase: 'Semi',    won: 2, lost: 0 },
    { phase: 'Final',   won: 2, lost: 1 },
  ];
  const totalWon  = sets.reduce((s, p) => s + p.won,  0);
  const totalLost = sets.reduce((s, p) => s + p.lost, 0);
  return (
    <div className="card" style={{ padding: '20px 20px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--qg-fg-3)', marginBottom: 14 }}>
        Sets por fase
      </div>
      <div style={{ display: 'flex', height: 24, gap: 2, marginBottom: 12 }}>
        {sets.map((p, i) => {
          const total = p.won + p.lost;
          const share = total / 11;
          return (
            <div key={i} style={{ flex: share, display: 'flex', gap: 2, minWidth: 0 }}>
              {Array.from({ length: p.won }).map((_, j) => (
                <div key={j} style={{ flex: 1, background: 'var(--qg-green)', borderRadius: 2 }} />
              ))}
              {Array.from({ length: p.lost }).map((_, j) => (
                <div key={j} style={{ flex: 1, background: 'var(--qg-clay)', borderRadius: 2 }} />
              ))}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        {sets.map((p, i) => {
          const total = p.won + p.lost;
          const share = total / 11;
          return (
            <div key={i} style={{ flex: share, textAlign: 'center', fontSize: 9, color: 'var(--qg-fg-3)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
              {p.phase}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
        <div>
          <span style={{ fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700, color: 'var(--qg-green)' }}>{totalWon}</span>
          <span style={{ fontSize: 11, color: 'var(--qg-fg-3)', marginLeft: 6, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>sets ganhos</span>
        </div>
        <div>
          <span style={{ fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700, color: 'var(--qg-clay)' }}>{totalLost}</span>
          <span style={{ fontSize: 11, color: 'var(--qg-fg-3)', marginLeft: 6, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{totalLost === 1 ? 'set perdido' : 'sets perdidos'}</span>
        </div>
      </div>
    </div>
  );
}

function BalanceTiles({ playerName, editionFilter, style }: { playerName: string; editionFilter: Set<number>; style?: React.CSSProperties }) {
  const myGames = games.filter(g =>
    (g.p1 === playerName || g.p2 === playerName) &&
    editionFilter.has(g.edition) &&
    !g.wo
  );
  let gWon = 0, gLost = 0, sWon = 0, sLost = 0;
  myGames.forEach(g => {
    const parsed = parseGameStats(g.result, g.p1 === playerName);
    if (parsed) {
      gWon += parsed.gamesWon; gLost += parsed.gamesLost;
      sWon += parsed.setsWon;  sLost += parsed.setsLost;
    }
  });
  const gTotal = gWon + gLost;
  const gBalance = gWon - gLost;
  const gPct = gTotal > 0 ? Math.round((gWon / gTotal) * 100) : 0;
  const sTotal = sWon + sLost;
  const sBalance = sWon - sLost;
  const sPct = sTotal > 0 ? Math.round((sWon / sTotal) * 100) : 0;
  const fmt = (n: number) => n > 0 ? `+${n}` : `${n}`;
  const balanceColor = (n: number) => n >= 0 ? 'var(--qg-green)' : 'var(--qg-clay)';
  const tiles = [
    {
      eyebrow: 'Saldo de Games',
      value: gTotal > 0 ? fmt(gBalance) : '—',
      valueStyle: { color: balanceColor(gBalance) },
      chart: gTotal > 0 ? <WinLossBar wins={gWon} losses={gLost} /> : null,
    },
    {
      eyebrow: '% de Games Ganhos',
      value: gTotal > 0 ? `${gPct}%` : '—',
      valueStyle: { color: 'var(--qg-green)' },
      chart: gTotal > 0 ? <MiniDonut winPct={gPct} /> : null,
    },
    {
      eyebrow: 'Saldo de Sets',
      value: sTotal > 0 ? fmt(sBalance) : '—',
      valueStyle: { color: balanceColor(sBalance) },
      chart: sTotal > 0 ? <WinLossBar wins={sWon} losses={sLost} /> : null,
    },
    {
      eyebrow: '% de Sets Ganhos',
      value: sTotal > 0 ? `${sPct}%` : '—',
      valueStyle: { color: 'var(--qg-green)' },
      chart: sTotal > 0 ? <MiniDonut winPct={sPct} /> : null,
    },
  ];
  return (
    <div className="dash-stats" style={style}>
      {tiles.map((tile, i) => (
        <div key={i} className="dash-stat" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 16px' }}>
            <div className="dash-stat-eyebrow">{tile.eyebrow}</div>
            <div className="dash-stat-num" style={tile.valueStyle}>{tile.value}</div>
          </div>
          <div style={{ borderTop: '1px solid var(--qg-line)', padding: '12px 20px 10px' }}>
            {tile.chart}
          </div>
        </div>
      ))}
    </div>
  );
}

function HeadToHead({ playerName }: { playerName: string }) {
  const myGames = games.filter(g => g.p1 === playerName || g.p2 === playerName);
  const records: Record<string, { wins: number; losses: number; lastResult: string; lastWon: boolean }> = {};

  myGames.forEach(g => {
    const opponent = g.p1 === playerName ? g.p2 : g.p1;
    const won = g.p1 === playerName;
    if (!records[opponent]) records[opponent] = { wins: 0, losses: 0, lastResult: '', lastWon: true };
    if (won) records[opponent].wins++;
    else records[opponent].losses++;
    records[opponent].lastResult = g.result;
    records[opponent].lastWon = won;
  });

  const opponents = Object.entries(records).sort((a, b) => (b[1].wins - b[1].losses) - (a[1].wins - a[1].losses));
  if (opponents.length === 0) return null;

  const [myFirst, myLast] = playerName.split(' ');

  const COL = '1fr auto 1fr';

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="card-header">
        Confronto Direto
        <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.6, letterSpacing: '0.1em' }}>
          {opponents.length} adversário{opponents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {opponents.map(([opponent, rec], i) => {
        const [oppFirst, ...oppRest] = opponent.split(' ');

        const matLeads = rec.wins > rec.losses;
        const oppLeads = rec.losses > rec.wins;
        const accentBar = matLeads
          ? '4px solid var(--qg-green)'
          : oppLeads
          ? '4px solid var(--qg-clay)'
          : 'none';
        const gradient = matLeads
          ? 'linear-gradient(to right, rgba(var(--qg-green-rgb),0.14) 0%, rgba(var(--qg-green-rgb),0.06) 45%, transparent 75%)'
          : oppLeads
          ? 'linear-gradient(to left, rgba(var(--qg-clay-rgb),0.14) 0%, rgba(var(--qg-clay-rgb),0.06) 45%, transparent 75%)'
          : 'none';

        return (
          <div key={opponent} style={{
            display: 'grid', gridTemplateColumns: COL,
            alignItems: 'center', gap: 16,
            padding: '16px 20px',
            borderBottom: i < opponents.length - 1 ? '1px solid var(--qg-line)' : 'none',
            background: gradient,
            borderLeft: matLeads ? accentBar : 'none',
            borderRight: oppLeads ? accentBar : 'none',
          }}>

            {/* Left: me */}
            <div>
              <div style={{
                fontFamily: 'var(--qg-font-display)', fontSize: 15, fontWeight: 700,
                textTransform: 'uppercase' as const, letterSpacing: '0.04em',
                color: 'var(--qg-fg-1)',
              }}>
                {myFirst}
              </div>
              <div style={{
                fontFamily: 'var(--qg-font-display)', fontSize: 11,
                textTransform: 'uppercase' as const, letterSpacing: '0.04em',
                color: 'var(--qg-fg-3)', marginTop: 2,
              }}>
                {myLast}
              </div>
            </div>

            {/* Center: H2H record */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700,
                color: 'var(--qg-green)', lineHeight: 1,
              }}>
                {rec.wins}
              </span>
              <span style={{ color: 'var(--qg-fg-4)', fontWeight: 600, fontSize: 16 }}>–</span>
              <span style={{
                fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700,
                color: rec.losses > 0 ? 'var(--qg-clay)' : 'var(--qg-fg-4)', lineHeight: 1,
              }}>
                {rec.losses}
              </span>
            </div>

            {/* Right: opponent */}
            <div style={{ textAlign: 'right' as const }}>
              <div style={{
                fontFamily: 'var(--qg-font-display)', fontSize: 15, fontWeight: 700,
                textTransform: 'uppercase' as const, letterSpacing: '0.04em',
                color: 'var(--qg-fg-1)',
              }}>
                {oppFirst}
              </div>
              {oppRest.length > 0 && (
                <div style={{
                  fontFamily: 'var(--qg-font-display)', fontSize: 11,
                  textTransform: 'uppercase' as const, letterSpacing: '0.04em',
                  color: 'var(--qg-fg-3)', marginTop: 2,
                }}>
                  {oppRest.join(' ')}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmBrevePlayer({ editionId }: { editionId: number }) {
  const ed = editions.find(e => e.id === editionId)!;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: 16, textAlign: 'center' }}>
      <span style={{
        fontFamily: 'var(--qg-font-display)', fontWeight: 700, fontSize: 10,
        letterSpacing: '0.14em', textTransform: 'uppercase' as const,
        background: 'var(--qg-clay-wash)', color: 'var(--qg-clay)',
        padding: '4px 14px', borderRadius: 'var(--qg-radius-sm)',
      }}>
        Em breve
      </span>
      <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 40, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.02em', color: 'var(--qg-fg-1)', lineHeight: 1 }}>
        {ed.label}
      </div>
      <div style={{ fontSize: 14, color: 'var(--qg-fg-2)', lineHeight: 1.8 }}>
        Início previsto em <strong>{ed.startDate}</strong>.<br />
        Seu desempenho será exibido aqui após o início do campeonato.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

export default function PainelPage() {
  const { data: session, status } = useSession();
  const [selected, setSelected] = useState<Set<number>>(new Set(editions.map(e => e.id)));
  const [historyTab, setHistoryTab] = useState(2);

  const playerName = session?.user?.playerName ?? null;

  // Auth guard
  if (status === 'loading') {
    return <div className="page" style={{ paddingTop: 80, textAlign: 'center', color: 'var(--qg-fg-4)' }}>Carregando…</div>;
  }
  if (status === 'unauthenticated') {
    return (
      <>
        <div className="page" style={{ paddingTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 32, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--qg-fg-1)' }}>
            Painel do Jogador
          </div>
          <div style={{ fontSize: 14, color: 'var(--qg-fg-3)', maxWidth: 360, lineHeight: 1.7 }}>
            Faça login com o Google para acessar seu painel com estatísticas, histórico de partidas e seu caminho no torneio.
          </div>
          <button
            onClick={() => signIn('google')}
            style={{ marginTop: 8, padding: '12px 28px', background: 'var(--qg-green)', color: 'var(--qg-cream)', border: 'none', borderRadius: 'var(--qg-radius-sm)', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer' }}
          >
            Entrar com Google
          </button>
          <Link href="/draws" style={{ fontSize: 12, color: 'var(--qg-fg-4)', textDecoration: 'underline', marginTop: 4 }}>
            Ver as chaves sem fazer login
          </Link>
        </div>
        <Footer />
      </>
    );
  }
  if (!playerName) {
    return (
      <>
        <div className="page" style={{ paddingTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700, textTransform: 'uppercase', color: 'var(--qg-fg-1)' }}>
            Perfil não vinculado
          </div>
          <div style={{ fontSize: 14, color: 'var(--qg-fg-3)', maxWidth: 380, lineHeight: 1.7 }}>
            Sua conta (<strong>{session?.user?.email}</strong>) ainda não está associada a nenhum jogador do torneio. Fale com o organizador para vincular seu acesso.
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const selectedIds = [...selected];
  const hasData     = selectedIds.some(id => editions.find(e => e.id === id)?.status === 'completed');
  const isUpcoming  = !hasData;

  return (
    <>
      <div className="page" style={{ paddingTop: 48 }}>

        {/* Player header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--qg-clay)', marginBottom: 4 }}>
              Painel do jogador
            </div>
            <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 32, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--qg-fg-1)' }}>
              {playerName}
            </div>
          </div>
          <EditionMultiDropdown editions={editions} selected={selected} onChange={setSelected} />
        </div>

        {isUpcoming ? <EmBrevePlayer editionId={2} /> : (
          <>
            {/* KPI tiles */}
            {(() => {
              const { wins: kpiWins, losses: kpiLosses } = computeWinsLosses(playerName, selectedIds, games);
              const edLabels = editions.filter(e => selected.has(e.id)).map(e => ({ id: e.id, label: e.shortLabel }));

              let running = 0;
              const pointsCumulativeSeries = editions.filter(e => selected.has(e.id)).map(ed => {
                const pts = editionPoints[ed.id]?.[playerName];
                if (pts !== undefined) { running += pts; return { label: ed.shortLabel, value: running }; }
                return { label: ed.shortLabel, value: null };
              });
              const totalPoints = running;

              const selectedEditions = editions.filter(e => selected.has(e.id));
              const rankingSeries = selectedEditions.map((ed, i) => {
                const completedSoFar = selectedEditions.slice(0, i + 1).filter(e => e.status === 'completed');
                if (completedSoFar.length === 0 || ed.status !== 'completed') return { label: ed.shortLabel, value: null };
                const totals: Record<string, number> = {};
                completedSoFar.forEach(e =>
                  Object.entries(editionPoints[e.id] ?? {}).forEach(([n, p]) => { totals[n] = (totals[n] ?? 0) + p; })
                );
                const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
                const pos = sorted.findIndex(([n]) => n === playerName) + 1;
                return { label: ed.shortLabel, value: pos > 0 ? pos : null };
              });
              const currentRankingPos = rankingSeries.filter(s => s.value !== null).at(-1)?.value ?? null;

              return (
                <div className="dash-stats" style={{ marginBottom: 32 }}>
                  {[
                    {
                      eyebrow: 'Posição no Ranking',
                      value: currentRankingPos ? `${currentRankingPos}º` : '—',
                      series: rankingSeries,
                      invert: true,
                    },
                    {
                      eyebrow: 'Pontos do Ranking',
                      value: totalPoints || '—',
                      series: pointsCumulativeSeries,
                      invert: false,
                    },
                    {
                      eyebrow: 'Aproveitamento',
                      value: (() => {
                        const total = kpiWins + kpiLosses;
                        return total > 0 ? `${Math.round((kpiWins / total) * 100)}%` : '—';
                      })(),
                      series: [],
                      invert: false,
                      chart: (() => {
                        const total = kpiWins + kpiLosses;
                        const pct = total > 0 ? Math.round((kpiWins / total) * 100) : 0;
                        return <MiniDonut winPct={pct} />;
                      })(),
                    },
                    {
                      eyebrow: 'Vitórias · Derrotas',
                      value: `${kpiWins}V · ${kpiLosses}D`,
                      series: [],
                      invert: false,
                      chart: <WinLossBar wins={kpiWins} losses={kpiLosses} />,
                    },
                  ].map((tile, i) => (
                    <div key={i} className="dash-stat" style={{ padding: 0, overflow: 'hidden' }}>
                      <div style={{ padding: '20px 20px 16px' }}>
                        <div className="dash-stat-eyebrow">{tile.eyebrow}</div>
                        <div className="dash-stat-num">{tile.value}</div>
                      </div>
                      <div style={{ borderTop: '1px solid var(--qg-line)', padding: '12px 20px 10px' }}>
                        {(tile as any).chart ?? <Sparkline data={tile.series} invert={tile.invert} />}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Game/Set balance tiles */}
            <BalanceTiles playerName={playerName} editionFilter={selected} style={{ marginBottom: 32 }} />

            {/* Head-to-head carousel */}
            <div style={{ marginBottom: 64 }}>
              <HeadToHead playerName={playerName} />
            </div>

            {/* Histórico por edição */}
            <div style={{ borderTop: '1px solid var(--qg-line)', paddingTop: 64, marginBottom: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--qg-clay)', marginBottom: 4 }}>
                Retrospecto por edição
              </div>
              <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--qg-fg-1)', marginBottom: 24 }}>
                Histórico completo
              </div>

              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: '2px solid var(--qg-line)', marginBottom: 40 }}>
                {editions.map(ed => (
                  <button
                    key={ed.id}
                    onClick={() => setHistoryTab(ed.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '10px 28px',
                      fontFamily: 'var(--qg-font-display)', fontSize: 13, fontWeight: 700,
                      textTransform: 'uppercase' as const, letterSpacing: '0.08em',
                      color: historyTab === ed.id ? 'var(--qg-clay)' : 'var(--qg-fg-3)',
                      borderBottom: `2px solid ${historyTab === ed.id ? 'var(--qg-clay)' : 'transparent'}`,
                      marginBottom: -2, transition: 'color 200ms, border-color 200ms',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    {ed.label}
                    {ed.status === 'active' && (
                      <span style={{
                        fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
                        background: 'var(--qg-clay)', color: 'var(--qg-cream)',
                        padding: '1px 5px', borderRadius: 2,
                      }}>AO VIVO</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab 1 — 1ª Edição */}
            {historyTab === 1 && (
              <>
                <div style={{ marginBottom: 32 }}>
                  <TournamentPath playerName={playerName} />
                </div>
                <BalanceTiles playerName={playerName} editionFilter={new Set([1])} style={{ marginBottom: 32 }} />
                <div className="page-grid-2" style={{ marginBottom: 32 }}>
                  <GamesChart />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(() => {
                      const { wins, losses } = computeWinsLosses(playerName, 1, games);
                      const total = wins + losses;
                      const pct = total > 0 ? Math.round((wins / total) * 100) : 0;
                      return (
                        <div className="card" style={{ overflow: 'hidden', flex: 1 }}>
                          <div className="card-header">Aproveitamento</div>
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 20px 0' }}>
                            <WinRateDonut wins={wins} total={total} />
                          </div>
                          <div style={{ textAlign: 'center', padding: '10px 20px 20px' }}>
                            <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700, color: 'var(--qg-green)', letterSpacing: '0.02em', lineHeight: 1 }}>
                              {wins}/{total}
                            </div>
                            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--qg-fg-3)', marginTop: 6 }}>
                              Vitórias
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--qg-line)' }}>
                            <div style={{ padding: '16px 20px', borderRight: '1px solid var(--qg-line)', textAlign: 'center' as const }}>
                              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--qg-fg-3)', marginBottom: 8 }}>Partidas</div>
                              <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 20, fontWeight: 700, color: 'var(--qg-fg-1)', letterSpacing: '0.02em' }}>
                                <span style={{ color: 'var(--qg-green)' }}>{wins}V</span>
                                {' · '}
                                <span style={{ color: losses > 0 ? 'var(--qg-clay)' : 'var(--qg-fg-3)' }}>{losses}D</span>
                              </div>
                            </div>
                            <div style={{ padding: '16px 20px', textAlign: 'center' as const }}>
                              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--qg-fg-3)', marginBottom: 8 }}>Aproveitamento</div>
                              <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 20, fontWeight: 700, color: 'var(--qg-green)', letterSpacing: '0.02em' }}>
                                {total > 0 ? `${pct}%` : '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <SetSummaryBar />
                  </div>
                </div>
              </>
            )}

            {/* Tab 2 — 2ª Edição */}
            {historyTab === 2 && (() => {
              const ed2MyGames = games.filter(
                g => g.edition === 2 && (g.p1 === playerName || g.p2 === playerName)
              );
              const allEd2Matches = Object.values(groupMatchesByEdition[2]).flat();

              const matchHistory2 = ed2MyGames.map(g => {
                const matIsP1 = g.p1 === playerName;
                const stats = parseGameStats(g.result, matIsP1);
                if (!stats) return null;
                const opponent = matIsP1 ? g.p2 : g.p1;
                const gm = allEd2Matches.find(m => m.id === g.id);
                const seed = gm ? (matIsP1 ? gm.p2.seed : gm.p1.seed) : 0;
                const [roundLabel] = g.round.split(' — ');
                return { round: roundLabel, phase: 'Grupo A', opponent, seed, won: stats.gamesWon, lost: stats.gamesLost, score: g.result };
              }).filter(Boolean) as MatchRow[];

              const setsByPhase: Record<string, { won: number; lost: number }> = {};
              ed2MyGames.forEach(g => {
                const matIsP1 = g.p1 === playerName;
                const stats = parseGameStats(g.result, matIsP1);
                if (!stats) return;
                const [, phaseLabel] = g.round.split(' — ');
                const key = phaseLabel ?? 'Grupo A';
                if (!setsByPhase[key]) setsByPhase[key] = { won: 0, lost: 0 };
                setsByPhase[key].won  += stats.setsWon;
                setsByPhase[key].lost += stats.setsLost;
              });
              const ed2Sets = Object.entries(setsByPhase).map(([phase, s]) => ({ phase, ...s }));

              const { wins: wins2, losses: losses2 } = computeWinsLosses(playerName, 2, games);
              const total2 = wins2 + losses2;
              const pct2 = total2 > 0 ? Math.round((wins2 / total2) * 100) : 0;

              return (
                <>
                  <div style={{ marginBottom: 32 }}>
                    <TournamentPath2 playerName={playerName} />
                  </div>
                  <BalanceTiles playerName={playerName} editionFilter={new Set([2])} style={{ marginBottom: 32 }} />
                  {matchHistory2.length > 0 && (
                    <div className="page-grid-2" style={{ marginBottom: 32 }}>
                      <GamesChart matches={matchHistory2} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="card" style={{ overflow: 'hidden', flex: 1 }}>
                          <div className="card-header">Aproveitamento</div>
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 20px 0' }}>
                            <WinRateDonut wins={wins2} total={total2} />
                          </div>
                          <div style={{ textAlign: 'center', padding: '10px 20px 20px' }}>
                            <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700, color: 'var(--qg-green)', letterSpacing: '0.02em', lineHeight: 1 }}>
                              {wins2}/{total2}
                            </div>
                            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--qg-fg-3)', marginTop: 6 }}>
                              Vitórias
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--qg-line)' }}>
                            <div style={{ padding: '16px 20px', borderRight: '1px solid var(--qg-line)', textAlign: 'center' as const }}>
                              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--qg-fg-3)', marginBottom: 8 }}>Partidas</div>
                              <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 20, fontWeight: 700, color: 'var(--qg-fg-1)', letterSpacing: '0.02em' }}>
                                <span style={{ color: 'var(--qg-green)' }}>{wins2}V</span>
                                {' · '}
                                <span style={{ color: losses2 > 0 ? 'var(--qg-clay)' : 'var(--qg-fg-3)' }}>{losses2}D</span>
                              </div>
                            </div>
                            <div style={{ padding: '16px 20px', textAlign: 'center' as const }}>
                              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--qg-fg-3)', marginBottom: 8 }}>Aproveitamento</div>
                              <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 20, fontWeight: 700, color: 'var(--qg-green)', letterSpacing: '0.02em' }}>
                                {total2 > 0 ? `${pct2}%` : '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                        {ed2Sets.length > 0 && <SetSummaryBar sets={ed2Sets} />}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>

      <Footer />
    </>
  );
}
