'use client';

import { useState } from 'react';
import Image from 'next/image';
import MatchCard from '@/components/MatchCard';
import Footer from '@/components/Footer';
import EditionDropdown from '@/components/EditionDropdown';
import type { BracketMatch, Edition, GroupMatch, SetScore } from '@/lib/data';
import { editions, groupMatchesByEdition, groupStandingsByEdition, mainBracket, consolationBracket, bronzeMatch, mainBracketE2, consolationBracketE2, bronzeE2, consolationBronzeE2 } from '@/lib/data';

/* ---- Em breve placeholder ---- */
function EmBreve({ edition }: { edition: Edition }) {
  return (
    <div className="page">
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '80px 0', textAlign: 'center', gap: 20,
      }}>
        <span style={{
          fontFamily: 'var(--qg-font-display)', fontWeight: 700, fontSize: 10,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          background: 'var(--qg-clay-wash)', color: 'var(--qg-clay)',
          padding: '4px 14px', borderRadius: 'var(--qg-radius-sm)',
        }}>
          Em breve
        </span>
        <div style={{
          fontFamily: 'var(--qg-font-display)', fontSize: 52, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.02em',
          color: 'var(--qg-fg-1)', lineHeight: 1,
        }}>
          {edition.label}
        </div>
        <div style={{ fontSize: 14, color: 'var(--qg-fg-2)', lineHeight: 1.8, maxWidth: 400 }}>
          Início previsto em <strong>{edition.startDate}</strong>.<br />
          Os confrontos serão divulgados após o sorteio dos grupos.
        </div>
      </div>
    </div>
  );
}

const QUALIFIED_SPOTS = 2;

function splitName(name: string): [string, string] {
  const i = name.indexOf(' ');
  return i === -1 ? [name, ''] : [name.slice(0, i), name.slice(i + 1)];
}

type PlayerConfig = { photo: string; position: string; scale: number };

const playerConfig: Record<number, PlayerConfig> = {
  1:  { photo: '/players/matias.jpeg',           position: 'center 40%', scale: 1    },
  2:  { photo: '/players/guilherme-puccini.jpeg', position: '100% 45%', scale: 1.3  },
  3:  { photo: '/players/mateus-palhares.jpeg',   position: 'center 10%', scale: 1    },
  4:  { photo: '/players/luiz-guilherme.jpeg',    position: '100% 35%', scale: 1.3  },
  14: { photo: '/players/diego-machado.jpeg',     position: 'center 35%', scale: 1.3  },
  5:  { photo: '/players/marcus-sodre.jpeg',       position: 'center 25%', scale: 1.4  },
  6:  { photo: '/players/silas-neto.jpeg',        position: '0% 35%',    scale: 1.3  },
  7:  { photo: '/players/guilherme-meismith-v2.jpeg', position: '60% 35%', scale: 1.6  },
  11: { photo: '/players/caio-bessa.jpeg',        position: '80% 23%',    scale: 1.3  },
  8:  { photo: '/players/lucas-chequer.jpeg',     position: 'center 43%', scale: 1.3  },
  9:  { photo: '/players/leonardo-souza.jpeg',    position: 'center 35%', scale: 1    },
  12: { photo: '/players/gabriel-holzmann.jpeg',  position: 'center 50%', scale: 1.3  },
  13: { photo: '/players/luiz-fernando.jpeg',     position: 'center 35%', scale: 1    },
  15: { photo: '/players/pedro-lara.jpeg',        position: 'center 35%', scale: 1.2  },
  16: { photo: '/players/vitor-palhares.jpeg',   position: 'center 30%', scale: 1.0  },
};

const playerConfigByEdition: Record<number, Record<number, PlayerConfig>> = {
  2: {
    10: { photo: '/players/lucas-guarany.jpeg', position: 'center 35%', scale: 1.3 },
  },
};

const placeholderBg = [
  'linear-gradient(145deg, #0b2016 0%, #05120c 100%)',
  'linear-gradient(145deg, #121a0d 0%, #080f07 100%)',
  'linear-gradient(145deg, #1a1208 0%, #0e0d06 100%)',
  'linear-gradient(145deg, #0f1510 0%, #060c07 100%)',
];

/* ---- Standings cards (horizontal) ---- */
function StandingsCards({ group, editionId }: { group: string; editionId: number }) {
  const rows = groupStandingsByEdition[editionId]?.[group] ?? [];
  const anyPlayed = rows.some(r => r.pts > 0 || r.games !== 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rows.length}, 1fr)`, gap: 12 }}>
      {rows.map((row, i) => {
        const qualified = anyPlayed && i < QUALIFIED_SPOTS;
        const twoLine = rows.length === 4;
        const [firstName, lastName] = splitName(row.name);
        const config = playerConfigByEdition[editionId]?.[row.seed] ?? playerConfig[row.seed] ?? null;
        const photo = config?.photo ?? null;
        const bg = placeholderBg[i % placeholderBg.length];

        return (
          <div key={row.seed} style={{
            border: '1px solid var(--qg-line)',
            borderRadius: 'var(--qg-radius-md)',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'relative',
              minHeight: 280,
              padding: '12px 14px 16px',
              background: photo ? undefined : bg,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              {photo && config && (
                <Image
                  src={photo}
                  alt={row.name}
                  fill
                  quality={92}
                  sizes="33vw"
                  style={{
                    objectFit: 'cover',
                    objectPosition: config.position,
                    transform: `scale(${config.scale})`,
                    transformOrigin: config.position,
                    filter: !qualified ? 'grayscale(1)' : undefined,
                  }}
                />
              )}

              {/* Cinematic gradient overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: photo
                  ? 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 38%, rgba(3,15,9,0.97) 100%)'
                  : 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(0,0,0,0.5) 100%)',
              }} />

              {/* Badge — top-right */}
              {anyPlayed && (
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: '#fff',
                    background: qualified ? 'rgba(211,82,32,0.75)' : 'rgba(0,0,0,0.4)',
                    padding: '3px 8px', borderRadius: 2,
                    backdropFilter: 'blur(4px)',
                  }}>
                    {qualified ? 'Classificado' : 'Eliminado'}
                  </span>
                </div>
              )}

              {/* Bottom: position + name · stats */}
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
                <div>
                  <span style={{
                    fontFamily: 'var(--qg-font-display)', fontWeight: 700, fontSize: 36,
                    lineHeight: 1, display: 'block', marginBottom: 6,
                    color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.5)',
                  }}>
                    {row.pos}
                  </span>
                  <div style={{
                    fontFamily: 'var(--qg-font-display)', fontWeight: 700, fontSize: 16,
                    textTransform: 'uppercase', letterSpacing: '0.03em',
                    color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.8)',
                    display: 'flex', flexDirection: 'column', gap: 1,
                  }}>
                    {twoLine ? (
                      <>
                        <span>{firstName}</span>
                        <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                          {lastName}
                          <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>
                            ({row.seed})
                          </span>
                        </span>
                      </>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        {row.name}
                        <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>
                          ({row.seed})
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexShrink: 0 }}>
                  {([
                    ['PTS',   row.pts],
                    ['SETS',  row.sets  > 0 ? `+${row.sets}`  : row.sets],
                    ['GAMES', row.games > 0 ? `+${row.games}` : row.games],
                  ] as [string, number | string][]).map(([label, value]) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                        marginBottom: 3, color: 'rgba(255,255,255,0.55)',
                      }}>
                        {label}
                      </div>
                      <div style={{
                        fontFamily: 'var(--qg-font-display)', fontWeight: 700, fontSize: 22,
                        lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                        color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.7)',
                      }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Face-off match ---- */
function SetScore({ v, loss }: { v: SetScore | '—'; loss: boolean }) {
  const base: React.CSSProperties = {
    width: 32, textAlign: 'center', flexShrink: 0,
    fontFamily: 'var(--qg-font-display)', fontVariantNumeric: 'tabular-nums',
    fontWeight: loss ? 400 : 700, fontSize: 20, lineHeight: 1,
    color: loss ? 'var(--qg-fg-3)' : 'var(--qg-fg-1)',
  };
  if (v === '—') return <div style={{ ...base, fontWeight: 400, fontSize: 14, color: 'var(--qg-fg-3)' }}>—</div>;
  if (typeof v === 'object') return <div style={base}>{v.main}<sup style={{ fontSize: '0.5em', fontWeight: 400 }}>{v.tb}</sup></div>;
  return <div style={base}>{v}</div>;
}

function FaceOffMatch({ match }: { match: GroupMatch }) {
  const played = match.scores1.some(s => s !== '—');
  const p1wins = match.winner === 1;
  const p2wins = match.winner === 2;
  const p1loss = played && !p1wins;
  const p2loss = played && !p2wins;
  const pad = (s: (SetScore | '—')[]) => { const a = [...s]; while (a.length < 3) a.push('—'); return a; };

  const rowBg = (wins: boolean) =>
    !played ? 'var(--qg-bg-elev)' : wins ? 'var(--qg-green-wash)' : 'var(--qg-bg-sub)';

  const PlayerRow = ({
    name, seed, scores, wins, loss, wo,
  }: {
    name: string; seed: number; scores: (SetScore | '—')[];
    wins: boolean; loss: boolean; wo: boolean;
  }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 16px', background: rowBg(wins),
    }}>
      <div style={{
        flex: 1, fontFamily: 'var(--qg-font-display)', fontWeight: 700,
        fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em',
        color: loss ? 'var(--qg-fg-3)' : 'var(--qg-fg-1)',
        display: 'flex', alignItems: 'center', gap: 8, minWidth: 0,
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
        <span style={{ fontSize: 11, fontWeight: 400, color: loss ? 'var(--qg-fg-3)' : 'var(--qg-fg-2)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          ({seed})
        </span>
        {wo && <span className="pill pill-wo">WO</span>}
        {wins && <span className="match-row-check" style={{ fontFamily: 'var(--qg-font-body)' }}>✓</span>}
      </div>
      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {pad(scores).map((s, i) => <SetScore key={i} v={s} loss={loss} />)}
      </div>
    </div>
  );

  return (
    <div style={{ border: '1px solid var(--qg-line)', borderRadius: 'var(--qg-radius-md)', overflow: 'hidden' }}>
      <PlayerRow name={match.p1.name} seed={match.p1.seed} scores={match.scores1} wins={p1wins} loss={p1loss} wo={match.wo === 1} />
      <div style={{ height: 1, background: 'var(--qg-line)' }} />
      <PlayerRow name={match.p2.name} seed={match.p2.seed} scores={match.scores2} wins={p2wins} loss={p2loss} wo={match.wo === 2} />
    </div>
  );
}

function RoundSection({ matches }: { matches: GroupMatch[] }) {
  const { round, dates } = matches[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontFamily: 'var(--qg-font-display)', fontWeight: 700, fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--qg-fg-2)', whiteSpace: 'nowrap',
        }}>
          {round}
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--qg-line)' }} />
        <span style={{ fontSize: 11, color: 'var(--qg-fg-3)', whiteSpace: 'nowrap' }}>{dates}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map(m => <FaceOffMatch key={m.id} match={m} />)}
      </div>
    </div>
  );
}

/* ---- Groups view ---- */
function GroupsView({ editionId, editionLabel }: { editionId: number; editionLabel: string }) {
  const [group, setGroup] = useState('A');
  const matches = groupMatchesByEdition[editionId]?.[group] ?? [];

  const rounds = matches.reduce<{ key: string; items: GroupMatch[] }[]>((acc, m) => {
    const key = `${m.round}||${m.dates}`;
    const existing = acc.find(r => r.key === key);
    if (existing) existing.items.push(m);
    else acc.push({ key, items: [m] });
    return acc;
  }, []);

  return (
    <>
      <div className="page">
        <div className="tabs">
          {['A', 'B', 'C', 'D'].map(g => (
            <button key={g} className={'tab' + (group === g ? ' active' : '')} onClick={() => setGroup(g)}>
              Grupo {g}
            </button>
          ))}
        </div>

        <StandingsCards group={group} editionId={editionId} />

        <div style={{
          marginTop: 12, paddingBottom: 16, borderBottom: '1px solid var(--qg-line)',
          fontSize: 11, color: 'var(--qg-fg-3)', letterSpacing: '0.02em',
        }}>
          <span style={{ fontWeight: 600, marginRight: 6, color: 'var(--qg-fg-2)' }}>Critérios:</span>
          Pontos · Confronto direto · Saldo de sets · Saldo de games · Sorteio
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 32 }}>
          {rounds.map(r => <RoundSection key={r.key} matches={r.items} />)}
        </div>
      </div>
    </>
  );
}

/* ---- Bracket ---- */
function BMatchRow({ p, ghost }: { p: BracketMatch['p1']; ghost?: boolean }) {
  const played = p.s.some(s => s !== '—');
  const lose = played && !p.w;
  const win = !ghost && p.w;
  const scores = [...p.s];
  while (scores.length < 3) scores.push('—');

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px',
        background: win ? 'var(--qg-green-wash)' : lose ? 'var(--qg-bg-sub)' : 'var(--qg-bg-elev)',
      }}>
        <span style={{
          fontSize: 11, color: 'var(--qg-fg-3)', minWidth: 18,
          textAlign: 'right', flexShrink: 0,
        }}>
          {p.seed || '—'}
        </span>
        <div style={{
          flex: 1, fontFamily: 'var(--qg-font-display)', fontWeight: lose ? 400 : 700,
          fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em',
          color: lose ? 'var(--qg-fg-3)' : 'var(--qg-fg-1)',
          display: 'flex', alignItems: 'center', gap: 8, minWidth: 0,
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
          {win && <span className="match-row-check" style={{ fontFamily: 'var(--qg-font-body)' }}>✓</span>}
          {p.wo && <span className="pill pill-wo">WO</span>}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {scores.map((v, i) => <SetScore key={i} v={v as SetScore | '—'} loss={lose} />)}
        </div>
      </div>
    </>
  );
}

function FinalCard({ match }: { match: BracketMatch }) {
  const players = [match.p1, match.p2] as BracketMatch['p1'][];

  const setWinners = match.p1.s.map((s0, i) => {
    const s1 = match.p2.s[i];
    if (s0 === '—' || s1 === '—') return -1;
    const v0 = typeof s0 === 'object' ? Number(s0.main) : Number(s0);
    const v1 = typeof s1 === 'object' ? Number(s1.main) : Number(s1);
    if (v0 > v1) return 0;
    if (v1 > v0) return 1;
    return -1;
  });

  return (
    <div style={{
      border: '1px solid var(--qg-clay)',
      borderRadius: 'var(--qg-radius-md)',
      overflow: 'hidden',
      display: 'grid',
      gridTemplateRows: '1fr 1fr',
      height: 360,
    }}>
      {players.map((p, side) => {
        const config = playerConfig[p.seed] ?? null;
        const [firstName, lastName] = splitName(p.name);
        const isRight = side === 1;
        const win = !!p.w;
        const lose = p.s.some(s => s !== '—') && !win;
        const scores = [...p.s];
        while (scores.length < 3) scores.push('—');
        const played = scores.some(s => s !== '—');

        return (
          <div key={side} style={{
            position: 'relative', overflow: 'hidden',
            background: config ? undefined : placeholderBg[side % placeholderBg.length],
          }}>
            {config && (
              <Image
                src={config.photo}
                alt={p.name}
                fill
                quality={92}
                sizes="15vw"
                style={{
                  objectFit: 'cover',
                  objectPosition: config.position,
                  transform: `scale(${config.scale})`,
                  transformOrigin: config.position,
                  filter: lose ? 'grayscale(1)' : win ? 'saturate(1.7) contrast(1.12)' : undefined,
                }}
              />
            )}

            {/* Cinematic gradient */}
            <div style={{
              position: 'absolute', inset: 0,
              background: isRight
                ? 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 38%, rgba(3,15,9,0.97) 100%)'
                : 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 38%, rgba(3,15,9,0.97) 100%)',
            }} />

            {/* Brand color overlay — winner only */}
            {win && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(211,82,32,0.45) 0%, rgba(5,72,47,0.5) 100%)',
                mixBlendMode: 'color',
                zIndex: 1,
              }} />
            )}


            {/* Center divider */}
            {!isRight && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 1, width: '100%',
                background: 'rgba(255,255,255,0.1)',
                zIndex: 2,
              }} />
            )}

            {/* Bottom: name + scores */}
            <div style={{
              position: 'absolute', ...(isRight ? { top: 0 } : { bottom: 0 }), left: 0, right: 0,
              padding: '16px 14px',
              zIndex: 2,
              display: 'flex',
              flexDirection: isRight ? 'column-reverse' : 'column',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              {/* Name + check */}
              <div style={{
                fontFamily: 'var(--qg-font-display)', fontWeight: 700, fontSize: 15,
                textTransform: 'uppercase', letterSpacing: '0.03em',
                color: lose ? 'rgba(255,255,255,0.45)' : '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.8)',
                lineHeight: 1.25,
                textAlign: 'left',
              }}>
                <div>{firstName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-start' }}>
                  {lastName}
                  {win && <span className="match-row-check" style={{ fontFamily: 'var(--qg-font-body)', fontSize: 14 }}>✓</span>}
                </div>
              </div>

              {/* Set scores */}
              {played && (
                <div style={{
                  display: 'flex', gap: 10,
                  flexDirection: 'row',
                }}>
                  {scores.map((s, i) => {
                    if (s === '—') return null;
                    const val = typeof s === 'object' ? s.main : s;
                    const tb  = typeof s === 'object' ? s.tb  : null;
                    const wonSet = setWinners[i] === side;
                    return (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: 9, fontWeight: 600, letterSpacing: '0.1em',
                          textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
                          marginBottom: 4,
                        }}>
                          S{i + 1}
                        </div>
                        <div style={{
                          fontFamily: 'var(--qg-font-display)', fontWeight: 700,
                          fontSize: 22, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                          color: wonSet ? '#fff' : lose ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.55)',
                          textShadow: wonSet ? 'none' : '0 1px 6px rgba(0,0,0,0.7)',
                          background: wonSet ? 'var(--qg-clay)' : 'transparent',
                          padding: wonSet ? '6px 10px' : '6px 10px',
                          borderRadius: 0,
                        }}>
                          {val}{tb !== null && <sup style={{ fontSize: '0.5em', fontWeight: 400 }}>{tb}</sup>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BMatchCard({ match, isFinal, ghost }: { match: BracketMatch; isFinal?: boolean; ghost?: boolean }) {
  if (isFinal) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span style={{
          background: 'var(--qg-clay)', color: 'var(--qg-cream)',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', padding: '4px 12px',
          borderRadius: 2,
        }}>
          Final · {match.dates}
        </span>
      </div>
      <FinalCard match={match} />
    </div>
  );

  return (
    <div style={{
      border: '1px solid var(--qg-line)',
      borderRadius: 'var(--qg-radius-md)',
      overflow: 'hidden',
    }}>
      <div style={{
        background: 'var(--qg-green-deep)',
        color: 'var(--qg-cream)',
        padding: '8px 14px',
        fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ textTransform: 'uppercase' }}>{match.round}</span>
        <span style={{ opacity: 0.45 }}>•</span>
        <span style={{ opacity: 0.7, fontWeight: 400 }}>{match.dates}</span>
      </div>
      <BMatchRow p={match.p1} ghost={ghost} />
      <div style={{ height: 1, background: 'var(--qg-line)' }} />
      <BMatchRow p={match.p2} ghost={ghost} />
    </div>
  );
}

/* ---- Bracket components ---- */

function BracketCard({ match, variant = 'normal', ghost = false, badge, champ = false }: {
  match: BracketMatch;
  variant?: 'normal' | 'final' | 'bronze';
  ghost?: boolean;
  badge?: string;
  champ?: boolean;
}) {
  const setWinners = match.p1.s.map((s0, i) => {
    const s1 = match.p2.s[i];
    if (s0 === '—' || s1 === '—') return -1;
    const v0 = typeof s0 === 'object' ? Number(s0.main) : Number(s0);
    const v1 = typeof s1 === 'object' ? Number(s1.main) : Number(s1);
    return v0 > v1 ? 0 : v1 > v0 ? 1 : -1;
  });

  const borderColor =
    variant === 'final' || champ ? 'var(--qg-green-deep)' :
                                   'var(--qg-line)';

  const badgeBg =
    variant === 'final'  ? 'linear-gradient(90deg, var(--qg-green-deep) 0%, var(--qg-clay) 100%)' :
                           'var(--qg-green-deep)';

  const badgeLabel =
    badge                ? badge                          :
    variant === 'final'  ? `Final · ${match.dates}`       :
    variant === 'bronze' ? `${match.round} · ${match.dates}` : null;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, opacity: ghost ? 0.4 : 1 }}>
      {badgeLabel && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: badgeBg!,
          color: 'var(--qg-cream)',
          fontSize: 9, fontWeight: 700, letterSpacing: '0.13em',
          textTransform: 'uppercase', padding: '3px 12px',
          whiteSpace: 'nowrap',
        }}>
          {badgeLabel}
        </span>
      )}
      {(() => {
        const rows = ([match.p1, match.p2] as BracketMatch['p1'][]).map((p, side) => {
          const win    = !!p.w;
          const played = p.s.some(s => s !== '—');
          const lose   = played && !win;
          const scores = [...p.s];
          while (scores.length < 3) scores.push('—');
          const [, lastName] = splitName(p.name);

          return (
            <div key={side}>
              {side === 1 && <div style={{ height: 1, background: 'var(--qg-line)' }} />}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                background:
                  variant === 'final' && win ? 'linear-gradient(90deg, var(--qg-green-deep) 0%, var(--qg-clay) 100%)' :
                  champ && win               ? 'var(--qg-green-deep)' :
                  win                        ? 'var(--qg-green-wash)' :
                  lose                       ? 'var(--qg-bg-sub)'     :
                                               'var(--qg-bg-elev)',
              }}>
                <span style={{
                  fontFamily: 'var(--qg-font-display)', fontSize: 10,
                  color: (variant === 'final' || champ) && win ? 'rgba(255,255,255,0.65)' : 'var(--qg-fg-3)',
                  minWidth: 14, textAlign: 'right', flexShrink: 0,
                }}>
                  {p.seed}
                </span>
                <span style={{
                  flex: 1, fontFamily: 'var(--qg-font-display)', fontWeight: lose ? 400 : 700,
                  fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.03em',
                  color: (variant === 'final' || champ) && win ? '#fff' : lose ? 'var(--qg-fg-3)' : 'var(--qg-fg-1)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 5, minWidth: 0,
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </span>
                  {win && <span className="match-row-check" style={{ fontFamily: 'var(--qg-font-body)', fontSize: 11, flexShrink: 0, color: (variant === 'final' || champ) && win ? '#fff' : undefined }}>✓</span>}
                  {p.wo && <span className="pill pill-wo" style={{ flexShrink: 0 }}>WO</span>}
                </span>
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  {scores.map((s, i) => {
                    if (s === '—') return null;
                    const val    = typeof s === 'object' ? s.main : s;
                    const tb     = typeof s === 'object' ? s.tb   : null;
                    const wonSet = setWinners[i] === side;
                    return (
                      <div key={i} style={{
                        fontFamily: 'var(--qg-font-display)', fontWeight: 700,
                        fontSize: 13, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                        padding: '4px 6px',
                        background: 'transparent',
                        color: (variant === 'final' || champ) && win ? '#fff' : lose ? 'var(--qg-fg-3)' : 'var(--qg-fg-1)',
                        borderRadius: 1,
                      }}>
                        {val}{tb !== null && <sup style={{ fontSize: '0.6em', fontWeight: 700 }}>{tb}</sup>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        });

        if (variant === 'final') {
          return (
            <div style={{ position: 'relative', width: '100%' }}>
              {/* Gradient fills the same bounding box as the inner card */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: 'var(--qg-radius-md)',
                background: 'linear-gradient(90deg, var(--qg-green-deep) 0%, var(--qg-clay) 100%)',
                pointerEvents: 'none',
              }} />
              {/* Transparent 2px border preserves the same height as other 2px-bordered cards;
                  the gradient behind shows through the transparent border area */}
              <div style={{
                position: 'relative',
                border: '2px solid transparent',
                borderRadius: 'var(--qg-radius-md)',
                overflow: 'hidden',
              }}>
                {rows}
              </div>
            </div>
          );
        }

        return (
          <div style={{
            width: '100%',
            border: `${champ ? 2 : 1}px solid ${borderColor}`,
            borderRadius: 'var(--qg-radius-md)',
            overflow: 'hidden',
          }}>
            {rows}
          </div>
        );
      })()}
      <span style={{ fontSize: 10, color: 'var(--qg-fg-3)', letterSpacing: '0.04em', visibility: badgeLabel ? 'hidden' : 'visible' }}>
        {match.dates}
      </span>
    </div>
  );
}

const BRACKET_LINE = 'var(--qg-line-strong)';
const BRACKET_W    = 48;

function BracketJoin({ reversed = false, champFrom }: { reversed?: boolean; champFrom?: 'top' | 'bottom' }) {
  // Row height = 96(QF1) + 316(spacer) + 96(QF3) = 508px
  // QF1 divider: (2+36)/508 = 38/508 ≈ 7.5%
  // QF3 divider: (412+1+36)/508 = 449/508 ≈ 88.4%
  // SF midpoint: (206+2+36)/508 = 244/508 ≈ 48%
  const xQf  = reversed ? BRACKET_W : 0;
  const xSf  = reversed ? 0 : BRACKET_W;
  const xMid = BRACKET_W / 2;
  const champY = champFrom === 'top' ? 7.5 : champFrom === 'bottom' ? 88.4 : null;
  return (
    <div style={{ width: BRACKET_W, alignSelf: 'stretch' }}>
      <svg
        width={BRACKET_W} height="100%"
        viewBox={`0 0 ${BRACKET_W} 100`}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <path
          d={`M ${xQf} 7.5 H ${xMid} V 88.4 H ${xQf}`}
          fill="none" stroke={BRACKET_LINE} strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={xMid} y1="48" x2={xSf} y2="48"
          stroke={BRACKET_LINE} strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        {champY !== null && (
          <path
            d={`M ${xQf} ${champY} H ${xMid} V 48 H ${xSf}`}
            fill="none" stroke="var(--qg-green-deep)" strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  );
}

function BracketLine({ dropToBronze = false, champ = false, bronzeSide }: {
  dropToBronze?: boolean;
  champ?: boolean;
  bronzeSide?: 'left' | 'right';
}) {
  const xMid = BRACKET_W / 2;
  return (
    <div style={{ width: BRACKET_W, alignSelf: 'stretch' }}>
      <svg
        width={BRACKET_W} height="100%"
        viewBox={`0 0 ${BRACKET_W} 100`}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <line
          x1="0" y1="48" x2={BRACKET_W} y2="48"
          stroke={champ ? 'var(--qg-green-deep)' : BRACKET_LINE} strokeWidth={champ ? 2 : 1}
          vectorEffect="non-scaling-stroke"
        />
        {dropToBronze && (
          <path
            d={`M ${xMid} 48 V 80.2 H ${bronzeSide === 'right' ? BRACKET_W : 0}`}
            fill="none" stroke={BRACKET_LINE} strokeWidth="1" strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  );
}

function ColHeader({ label }: { label: string }) {
  return (
    <div style={{
      fontFamily: 'var(--qg-font-display)', fontWeight: 700, fontSize: 9,
      textTransform: 'uppercase', letterSpacing: '0.16em',
      color: 'var(--qg-fg-3)', textAlign: 'center', paddingTop: 14, paddingBottom: 0,
    }}>
      {label}
    </div>
  );
}

const bracketsByEdition: Record<number, {
  main: typeof mainBracket;
  consolation: typeof consolationBracket;
  bronze?: BracketMatch;
  consolationBronze?: BracketMatch;
}> = {
  1: { main: mainBracket,   consolation: consolationBracket,   bronze: bronzeMatch },
  2: { main: mainBracketE2, consolation: consolationBracketE2, bronze: bronzeE2, consolationBronze: consolationBronzeE2 },
};

function BracketView({ data, showBronze = false, editionId = 1, bronzeMatchData, champSide }: {
  data: typeof mainBracket | typeof consolationBracket;
  showBronze?: boolean;
  editionId?: number;
  bronzeMatchData?: BracketMatch;
  champSide?: 'left' | 'right';
}) {
  const champLeft  = champSide === 'left';
  const champRight = champSide === 'right';
  const colMap     = new Map(data.map(c => [c.col, c]));
  const finalMatch = colMap.get(2)?.matches[0];
  const sf1        = colMap.get(1)?.matches[0];
  const sf2        = colMap.get(3)?.matches[0];
  const qfLeftCol  = colMap.get(0);
  const qfRightCol = colMap.get(4);
  const [qf1, qf3] = qfLeftCol?.matches  ?? [];
  const [qf2, qf4] = qfRightCol?.matches ?? [];
  const ghostLeft  = qfLeftCol  && 'ghost' in qfLeftCol  && !!qfLeftCol.ghost;
  const ghostRight = qfRightCol && 'ghost' in qfRightCol && !!qfRightCol.ghost;

  const CONN = BRACKET_W;

  const Row = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
      {children}
    </div>
  );

  const Spacer = ({ n }: { n: number }) => (
    <div style={{ flex: n, flexShrink: 0 }} />
  );

  return (
    <div style={{ overflowX: 'auto', padding: '28px 40px 48px' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Column headers */}
        <div style={{ display: 'flex', width: '100%', marginBottom: 56 }}>
          {[
            { flex: 1, label: 'Quartas de final' },
            { flex: 0, w: CONN, label: '' },
            { flex: 1, label: 'Semi-finais' },
            { flex: 0, w: CONN, label: '' },
            { flex: 1, label: 'Final' },
            { flex: 0, w: CONN, label: '' },
            { flex: 1, label: 'Semi-finais' },
            { flex: 0, w: CONN, label: '' },
            { flex: 1, label: 'Quartas de final' },
          ].map(({ flex, w, label }, i) => (
            <div key={i} style={{ flex: flex || undefined, width: w, flexShrink: 0 }}>
              {label && <ColHeader label={label} />}
            </div>
          ))}
        </div>

        {/* Main bracket row */}
        <Row>
          {/* QF LEFT */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {qf1 && <BracketCard match={qf1} ghost={!!ghostLeft} badge={`Quartas de Final 1 · ${qf1.dates}`} champ={champLeft} />}
            <div style={{ height: 316, flexShrink: 0 }} />
            {qf3 && <BracketCard match={qf3} ghost={!!ghostLeft} badge={`Quartas de Final 3 · ${qf3.dates}`} />}
          </div>

          <BracketJoin champFrom={champLeft ? 'top' : undefined} />

          {/* SF LEFT */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 206, flexShrink: 0 }} />
            <div style={{ width: '100%' }}>{sf1 && <BracketCard match={sf1} badge={`Semifinal 1 · ${sf1.dates}`} champ={champLeft} />}</div>
          </div>

          <BracketLine dropToBronze={showBronze} champ={champLeft} bronzeSide="right" />

          {/* FINAL — logo floats at top (position:absolute), Final card offset by logo height + same gap as header→logo */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', position: 'relative', paddingTop: 206 }}>
            <img
              src={editionId === 1 ? '/logo-edicao-1.svg' : '/logo.png'}
              width={150} height={150}
              alt="QG Open"
              style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}
            />
            <div style={{ width: '100%' }}>
              {finalMatch && <BracketCard match={finalMatch} variant="final" />}
            </div>
            {showBronze && (
              <>
                <svg width="100%" height="110" style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}>
                  <line x1="0" y1="110" x2="100%" y2="110"
                    stroke={BRACKET_LINE} strokeWidth="1" strokeDasharray="3 3" />
                </svg>
                <BracketCard match={bronzeMatchData ?? bronzeMatch} variant="bronze" />
              </>
            )}
          </div>

          <BracketLine dropToBronze={showBronze} champ={champRight} bronzeSide="left" />

          {/* SF RIGHT */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 206, flexShrink: 0 }} />
            <div style={{ width: '100%' }}>{sf2 && <BracketCard match={sf2} badge={`Semifinal 2 · ${sf2.dates}`} champ={champRight} />}</div>
          </div>

          <BracketJoin reversed champFrom={champRight ? 'top' : undefined} />

          {/* QF RIGHT */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {qf2 && <BracketCard match={qf2} ghost={!!ghostRight} badge={`Quartas de Final 2 · ${qf2.dates}`} champ={champRight} />}
            <div style={{ height: 316, flexShrink: 0 }} />
            {qf4 && <BracketCard match={qf4} ghost={!!ghostRight} badge={`Quartas de Final 4 · ${qf4.dates}`} />}
          </div>
        </Row>


      </div>
    </div>
  );
}

/* ---- Main page ---- */
type Tab = 'groups' | 'main' | 'consolation';

export default function DrawsPage() {
  const [tab, setTab]             = useState<Tab>('groups');
  const [editionId, setEditionId] = useState(2);

  const currentEdition = editions.find(e => e.id === editionId)!;
  const isUpcoming     = currentEdition.status === 'upcoming';
  const hasBracket     = currentEdition.status === 'completed' || !!bracketsByEdition[editionId];

  function handleEditionChange(id: number) {
    setEditionId(id);
    setTab('groups');
  }

  return (
    <>
      {/* Tab + Edition bar */}
      <div style={{ background: 'var(--qg-bg-elev)', borderBottom: '1px solid var(--qg-line)' }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 36px',
          display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: 16,
        }}>
          {/* Phase tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {([
              ['groups',      'Fase de Grupos'  ],
              ['main',        'Chave Principal' ],
              ['consolation', 'Chave Consolação'],
            ] as [Tab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key as Tab)}
                className={'tab' + (tab === key ? ' active' : '')}
                style={{ marginBottom: -1, opacity: key !== 'groups' && !hasBracket ? 0.4 : 1 }}
                disabled={key !== 'groups' && !hasBracket}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Edition dropdown */}
          <EditionDropdown
            editions={editions}
            selected={editionId}
            onChange={handleEditionChange}
          />
        </div>
      </div>

      {/* Content */}
      {isUpcoming ? (
        <EmBreve edition={currentEdition} />
      ) : (
        <>
          {tab === 'groups'      && <GroupsView editionId={editionId} editionLabel={currentEdition.shortLabel} />}
          {tab === 'main'        && <BracketView data={bracketsByEdition[editionId]?.main ?? mainBracket} showBronze={!!bracketsByEdition[editionId]?.bronze} bronzeMatchData={bracketsByEdition[editionId]?.bronze} editionId={editionId} champSide={editionId === 1 ? 'left' : undefined} />}
          {tab === 'consolation' && <BracketView data={bracketsByEdition[editionId]?.consolation ?? consolationBracket} showBronze={!!bracketsByEdition[editionId]?.consolationBronze} bronzeMatchData={bracketsByEdition[editionId]?.consolationBronze} editionId={editionId} champSide={editionId === 1 ? 'right' : undefined} />}
        </>
      )}

      <Footer />
    </>
  );
}
