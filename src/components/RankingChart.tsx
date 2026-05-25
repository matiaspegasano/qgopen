'use client';

import { useState, useMemo } from 'react';
import { editions, editionPoints, groupMatchesByEdition } from '@/lib/data';

const COLORS = [
  '#1447e6', '#c10007', '#008236', '#a800b7', '#497d00', '#ca3500',
  '#007595', '#c6005c', '#432dd7', '#bb4d00', '#00786f', '#c70036',
  '#7008e7', '#a65f00', '#0069a8', '#007a55', '#8200db',
];

const VW = 720, VH = 440;
const ML = 44, MT = 16, MR = 140, MB = 44;
const IW = VW - ML - MR, IH = VH - MT - MB;

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function toMonth(dateStr: string, baseYear: number): number {
  const [d, m, y] = dateStr.split('/').map(Number);
  return (y - baseYear) * 12 + (m - 1) + (d - 1) / 30;
}

type Pt = { month: number; pos: number };
type PlayerRow = { name: string; color: string; pts: Pt[]; currentPos: number; totalPoints: number };

function buildData() {
  const baseYear = parseInt(editions[0].startDate.split('/')[2]);
  const now = new Date();
  const currentMonth = (now.getFullYear() - baseYear) * 12 + now.getMonth() + now.getDate() / 30;

  const scored = editions
    .filter(e => e.endDate && (Object.values(editionPoints[e.id] ?? {}) as number[]).some(v => v > 0))
    .sort((a, b) => toMonth(a.endDate!, baseYear) - toMonth(b.endDate!, baseYear));

  if (!scored.length) return { rows: [], baseYear, currentMonth, xMax: 12, numPlayers: 17 };

  const namesFromPoints = scored.flatMap(ed => Object.keys(editionPoints[ed.id] ?? {}));
  const namesFromGroups = editions.flatMap(ed =>
    Object.values(groupMatchesByEdition[ed.id] ?? {}).flatMap(ms =>
      ms.flatMap(m => [m.p1.name, m.p2.name])
    )
  );
  const names = [...new Set([...namesFromPoints, ...namesFromGroups])];
  const numPlayers = names.length;

  /* Ordinal rankings (no ties) — tiebreak by original order in names array */
  function getRankings(cumPoints: Record<string, number>): Record<string, number> {
    const sorted = [...names].sort((a, b) => {
      const diff = cumPoints[b] - cumPoints[a];
      return diff !== 0 ? diff : names.indexOf(a) - names.indexOf(b);
    });
    const rankings: Record<string, number> = {};
    sorted.forEach((name, idx) => { rankings[name] = idx + 1; });
    return rankings;
  }

  /* Cumulative snapshots at each edition end */
  const snapshots: { startM: number; endM: number; cumPoints: Record<string, number> }[] = [];
  scored.forEach((ed, idx) => {
    const cumPoints: Record<string, number> = {};
    names.forEach(name => {
      let total = 0;
      for (let j = 0; j <= idx; j++) total += (editionPoints[scored[j].id]?.[name] ?? 0) as number;
      cumPoints[name] = total;
    });
    snapshots.push({ startM: toMonth(ed.startDate, baseYear), endM: toMonth(ed.endDate!, baseYear), cumPoints });
  });

  /* Pre-competition ranking: all at 0 pts, tiebreak by names order */
  const zeroRankings = getRankings(Object.fromEntries(names.map(n => [n, 0])));

  const rows: PlayerRow[] = names.map((name, i) => {
    const pts: Pt[] = [{ month: 0, pos: numPlayers }];

    snapshots.forEach(({ startM, endM, cumPoints }, idx) => {
      const prevPos = idx === 0 ? numPlayers : getRankings(snapshots[idx - 1].cumPoints)[name];
      const newPos  = getRankings(cumPoints)[name];
      pts.push({ month: startM, pos: prevPos }); // flat until edition starts
      pts.push({ month: endM,   pos: newPos  }); // diagonal during edition
    });

    if (pts[pts.length - 1].month < currentMonth)
      pts.push({ month: currentMonth, pos: pts[pts.length - 1].pos });

    const currentPos  = pts[pts.length - 1].pos;
    const totalPoints = snapshots.length > 0 ? snapshots[snapshots.length - 1].cumPoints[name] : 0;
    return { name, color: COLORS[i % COLORS.length], pts, currentPos, totalPoints };
  }).sort((a, b) => a.currentPos - b.currentPos);

  return { rows, baseYear, currentMonth, xMax: currentMonth + 0.3, numPlayers };
}

export default function RankingChart({ hideHeader, noCard }: { hideHeader?: boolean; noCard?: boolean } = {}) {
  const { rows, baseYear, currentMonth, xMax, numPlayers } = useMemo(buildData, []);
  const [active, setActive] = useState<string | null>(null);

  if (!rows.length) return null;

  const xOf = (m: number) => (m / xMax) * IW;
  const yOf = (pos: number) => IH * (pos - 1) / (numPlayers - 1);

  const xTicks = Array.from({ length: Math.floor(xMax) + 1 }, (_, i) => i);
  const yTicks = Array.from({ length: numPlayers }, (_, i) => i + 1);

  /* Label deconfliction (positions are equally spaced so rarely needed) */
  const LABEL_H = 13;
  const sortedByNatY = [...rows].sort((a, b) =>
    yOf(a.pts[a.pts.length - 1].pos) - yOf(b.pts[b.pts.length - 1].pos)
  );
  const adjY: Record<string, number> = {};
  sortedByNatY.forEach(r => { adjY[r.name] = yOf(r.pts[r.pts.length - 1].pos); });
  for (let i = 1; i < sortedByNatY.length; i++) {
    const pn = sortedByNatY[i - 1].name, cn = sortedByNatY[i].name;
    if (adjY[cn] < adjY[pn] + LABEL_H) adjY[cn] = adjY[pn] + LABEL_H;
  }
  const lastN = sortedByNatY[sortedByNatY.length - 1].name;
  if (adjY[lastN] > IH) adjY[lastN] = IH;
  for (let i = sortedByNatY.length - 2; i >= 0; i--) {
    const nn = sortedByNatY[i + 1].name, cn = sortedByNatY[i].name;
    if (adjY[cn] > adjY[nn] - LABEL_H) adjY[cn] = adjY[nn] - LABEL_H;
  }

  const inner = (
    <>
      {!hideHeader && (
        <div className="card-header">
          <span>Evolução no Ranking</span>
        </div>
      )}

      <div style={{ background: 'var(--qg-bg-elev)' }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <g transform={`translate(${ML},${MT})`}>

            {/* Grid line at every position */}
            {Array.from({ length: numPlayers }, (_, i) => i + 1).map(pos => (
              <line key={`gl-${pos}`} x1={0} y1={yOf(pos)} x2={xOf(currentMonth) - 4} y2={yOf(pos)}
                stroke="var(--qg-line)" strokeWidth={0.5} strokeDasharray="3 4" />
            ))}

            {/* Y-axis position labels */}
            {yTicks.map(pos => (
              <text key={`yl-${pos}`} x={-8} y={yOf(pos)} textAnchor="end" dominantBaseline="middle"
                fill="var(--qg-fg-3)" fontSize={9} fontFamily="var(--qg-font-display)">
                {pos}º
              </text>
            ))}

            {/* X-axis month labels */}
            {xTicks.map(m => (
              <text key={`xl-${m}`} x={xOf(m)} y={IH + 26} textAnchor="middle"
                fill="var(--qg-fg-3)" fontSize={10} fontFamily="var(--qg-font-display)">
                {MONTHS[m % 12]}
              </text>
            ))}

            {/* Year change markers */}
            {xTicks.filter(m => m > 0 && m % 12 === 0).map(m => (
              <g key={`yr-${m}`}>
                <line x1={xOf(m)} y1={0} x2={xOf(m)} y2={IH}
                  stroke="var(--qg-line-strong)" strokeWidth={1} strokeDasharray="2 4" />
                <text x={xOf(m) + 4} y={10}
                  fill="var(--qg-fg-3)" fontSize={9} fontFamily="var(--qg-font-display)">
                  {baseYear + Math.floor(m / 12)}
                </text>
              </g>
            ))}

            {/* Today line */}
            <line x1={xOf(currentMonth)} y1={0} x2={xOf(currentMonth)} y2={IH}
              stroke="var(--qg-clay)" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
            <text x={xOf(currentMonth) - 4} y={IH + 26} textAnchor="end"
              fill="var(--qg-clay)" fontSize={9} fontFamily="var(--qg-font-display)">
              hoje
            </text>

            {/* Player lines */}
            {rows.map(row => {
              const isSel = active === row.name;
              const dimmed = active !== null && !isSel;
              const last = row.pts[row.pts.length - 1];
              return (
                <g key={row.name}
                  style={{ opacity: dimmed ? 0.1 : 1, transition: 'opacity 180ms', cursor: 'pointer' }}
                  onMouseEnter={() => setActive(row.name)}
                  onMouseLeave={() => setActive(null)}
                >
                  {/* Wide transparent hit area */}
                  <polyline
                    points={row.pts.map(p => `${xOf(p.month)},${yOf(p.pos)}`).join(' ')}
                    fill="none" stroke="transparent" strokeWidth={12}
                  />
                  <polyline
                    points={row.pts.map(p => `${xOf(p.month)},${yOf(p.pos)}`).join(' ')}
                    fill="none" stroke={row.color} strokeWidth={1.8}
                    strokeLinejoin="round" strokeLinecap="round"
                  />
                  <circle cx={xOf(last.month)} cy={yOf(last.pos)} r={3.5}
                    fill={row.color} stroke="var(--qg-bg-elev)" strokeWidth={1.5} />
                  {/* Pill label */}
                  {(() => {
                    const posText = `${row.currentPos}º`;
                    const ptsText = `${row.totalPoints} pts`;
                    const pillW = 14 + 4 + row.name.length * 3.8 + 4 + ptsText.length * 3.2 + 6;
                    const px = xOf(last.month) + 8;
                    const py = adjY[row.name];
                    return (
                      <g>
                        <rect x={px} y={py - 5.5} width={pillW} height={11} rx={5.5} ry={5.5}
                          fill={isSel ? `${row.color}22` : 'transparent'}
                          stroke={isSel ? row.color : `${row.color}66`} strokeWidth={1.2} />
                        <text x={px + 7} y={py} dominantBaseline="middle" textAnchor="middle"
                          fontSize={5.5} fontFamily="var(--qg-font-display)" fontWeight={700}
                          fill={row.color}>
                          {posText}
                        </text>
                        <line x1={px + 13} y1={py - 4} x2={px + 13} y2={py + 4}
                          stroke={`${row.color}55`} strokeWidth={0.8} />
                        <circle cx={px + 18} cy={py} r={2.5} fill={row.color} />
                        <text x={px + 24} y={py} dominantBaseline="middle"
                          fontSize={6} fontFamily="var(--qg-font-display)"
                          letterSpacing="0.04em" fontWeight={600} fill="var(--qg-fg-1)">
                          {row.name.toUpperCase()}
                        </text>
                        <text x={px + pillW - 5} y={py} dominantBaseline="middle" textAnchor="end"
                          fontSize={5.5} fontFamily="var(--qg-font-display)" fontWeight={700}
                          fill={row.color}>
                          {ptsText}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              );
            })}

          </g>
        </svg>
      </div>
    </>
  );

  return noCard ? inner : <div className="card" style={{ overflow: 'hidden' }}>{inner}</div>;
}
