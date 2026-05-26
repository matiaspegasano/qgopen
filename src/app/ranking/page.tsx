'use client';

import { useState } from 'react';
import Image from 'next/image';
import TitleBar from '@/components/TitleBar';
import Footer from '@/components/Footer';
import EditionMultiDropdown from '@/components/EditionMultiDropdown';
import RankingChart from '@/components/RankingChart';
import { players, editions, editionPoints, groupStandingsByEdition, groupMatchesByEdition, games } from '@/lib/data';
import { computeProvisionalPoints } from '@/lib/stats';

const photoMap: Record<string, { src: string; pos: string; width?: number; offsetX?: number; flipX?: boolean }> = {
  'Matias Pegasano':    { src: '/players/matias.jpeg',             pos: 'center 31%', offsetX: 100 },
  'Guilherme Puccini':  { src: '/players/guilherme-puccini.jpeg',  pos: 'center 31%', width: 697, offsetX: 180 },
  'Mateus Palhares':    { src: '/players/mateus-palhares.jpeg',    pos: 'center 13.5%', width: 491 },
  'Luiz Guilherme':     { src: '/players/luiz-guilherme.jpeg',     pos: 'center 32.5%', width: 698, offsetX: 96 },
  'Diego Machado':      { src: '/players/diego-machado.jpeg',      pos: 'center 33%', width: 694, offsetX: 104 },
  'Marcus Ribeiro':     { src: '/players/marcus-sodre.jpeg',       pos: 'center 20%', offsetX: 200, width: 633 },
  'Silas Neto':         { src: '/players/silas-neto.jpeg',         pos: '0% 31.5%', flipX: true, width: 603, offsetX: 20 },
  'Guilherme Meismith': { src: '/players/guilherme-meismith-v2.jpeg', pos: 'center 32%', width: 806, offsetX: 152 },
  'Lucas Chequer':      { src: '/players/lucas-chequer.jpeg',      pos: 'center 35%', flipX: true, width: 660, offsetX: 115 },
  'Lucas Guarany':      { src: '/players/lucas-guarany.jpeg',      pos: 'center 31%', width: 726, offsetX: 189 },
  'Leo Souza':          { src: '/players/leonardo-souza.jpeg',     pos: 'center 25%', width: 459, offsetX: 69, flipX: true },
  'Caio Bessa':         { src: '/players/caio-bessa.jpeg',         pos: '80% 19.5%', width: 488, offsetX: 12 },
  'Gabriel Holzmann':   { src: '/players/gabriel-holzmann.jpeg',   pos: 'center 38.5%', width: 758, offsetX: 210 },
  'Luiz Fernando':      { src: '/players/luiz-fernando.jpeg',      pos: 'center 24%', flipX: true, offsetX: 72 },
  'Pedro Lara':         { src: '/players/pedro-lara.jpeg',         pos: 'center 28.5%', flipX: true, offsetX: 130 },
  'Vitor Palhares':     { src: '/players/vitor-palhares.jpeg',     pos: 'center 28.5%', width: 491, offsetX: 91 },
};

function PlayerAvatar({ name, rank }: { name: string; rank: number }) {
  const config = photoMap[name];
  const initials = name.split(' ').slice(0, 2).map((w: string) => w[0]).join('');
  const ringColor = rank === 1 ? 'var(--qg-clay)' : rank <= 3 ? 'var(--qg-green)' : 'var(--qg-line)';

  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      overflow: 'hidden', flexShrink: 0,
      border: `2px solid ${ringColor}`,
      position: 'relative',
      background: 'var(--qg-green)',
    }}>
      {config ? (
        <Image
          src={config.src}
          alt={name}
          fill
          sizes="40px"
          style={{ objectFit: 'cover', objectPosition: config.pos }}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--qg-font-display)', fontSize: 13, fontWeight: 700,
          color: 'var(--qg-cream)', letterSpacing: '0.04em',
        }}>
          {initials}
        </div>
      )}
    </div>
  );
}

function PosBadge({ pos }: { pos: number }) {
  if (pos === 1) return <span className="pos-badge pos-1">1</span>;
  if (pos === 2) return <span className="pos-badge pos-2">2</span>;
  if (pos === 3) return <span className="pos-badge pos-3">3</span>;
  return <span style={{ color: 'var(--qg-fg-3)', fontSize: 13, fontWeight: 500 }}>{pos}º</span>;
}

function buildRanking(selectedIds: number[]) {
  const completedIds = selectedIds.filter(id =>
    editions.find(e => e.id === id)?.status !== 'upcoming'
  );

  const effectivePoints: Record<number, Record<string, number>> = {};
  editions.forEach(ed => {
    if (ed.status !== 'upcoming') {
      effectivePoints[ed.id] = editionPoints[ed.id] ?? {};
    }
  });

  const nameSet = new Set<string>();
  editions.forEach(ed => {
    const groups = groupStandingsByEdition[ed.id];
    if (!groups) return;
    Object.values(groups).forEach(group => group.forEach(p => nameSet.add(p.name)));
  });

  const finalPosMap = Object.fromEntries(players.map(p => [p.name, p.finalPos]));

  return [...nameSet]
    .map(name => ({
      name,
      totalPoints: completedIds.reduce((s, id) => s + (effectivePoints[id]?.[name] ?? 0), 0),
      perEdition: selectedIds.map(id => effectivePoints[id]?.[name] ?? null),
      finalPos: finalPosMap[name] ?? 999,
    }))
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.finalPos - b.finalPos;
    });
}

export default function RankingPage() {
  const [selected, setSelected] = useState<Set<number>>(new Set(editions.map(e => e.id)));
  const [view, setView] = useState<'positions' | 'evolution'>('positions');

  const selectedIds    = [...selected];
  const completedIds   = selectedIds.filter(id => editions.find(e => e.id === id)?.status !== 'upcoming');
  const upcomingIds    = selectedIds.filter(id => editions.find(e => e.id === id)?.status === 'upcoming');
  const ranked         = buildRanking(selectedIds);

  return (
    <>
      <TitleBar title="Ranking" meta="Classificação geral · QG Open" />
      <div className="page">

        {/* Header row with filter */}
        <div className="ranking-header" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', marginBottom: 4 }}>
              Ranking
            </div>
            <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--qg-fg-1)' }}>
              Classificação
            </div>
          </div>
          <EditionMultiDropdown
            editions={editions}
            selected={selected}
            onChange={setSelected}
          />
        </div>

        <>
          <>
            <div className="card" style={{ overflow: 'hidden' }}>
              {/* New heading with toggle */}
              <div className="ranking-card-heading" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px 10px 24px',
                background: 'var(--qg-green)',
                borderBottom: '1px solid rgba(255,255,255,0.12)',
              }}>
                <div style={{
                  fontFamily: 'var(--qg-font-display)', fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--qg-cream)',
                }}>Ranking</div>
                <div style={{
                  display: 'flex', overflow: 'hidden',
                  border: '1px solid rgba(234,241,236,0.25)',
                  borderRadius: 'var(--qg-radius-sm)',
                }}>
                  <button
                    onClick={() => setView('positions')}
                    style={{
                      background: view === 'positions' ? 'var(--qg-cream)' : 'transparent',
                      color: view === 'positions' ? 'var(--qg-green-deep)' : 'rgba(234,241,236,0.5)',
                      border: 'none', cursor: 'pointer',
                      padding: '4px 10px',
                      fontFamily: 'var(--qg-font-display)', fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.05em', lineHeight: 1,
                      transition: 'background 150ms, color 150ms',
                    }}
                  >Posições</button>
                  <button
                    onClick={() => setView('evolution')}
                    style={{
                      background: view === 'evolution' ? 'var(--qg-cream)' : 'transparent',
                      color: view === 'evolution' ? 'var(--qg-green-deep)' : 'rgba(234,241,236,0.5)',
                      border: 'none', cursor: 'pointer',
                      padding: '4px 10px',
                      fontFamily: 'var(--qg-font-display)', fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.05em', lineHeight: 1,
                      transition: 'background 150ms, color 150ms',
                      borderLeft: '1px solid rgba(234,241,236,0.2)',
                    }}
                  >Evolução</button>
                </div>
              </div>

              {/* Subheading — only in positions view */}
              {view === 'positions' && (
                <div className="ranking-subheading" style={{
                  display: 'flex', alignItems: 'center',
                  padding: '8px 24px', gap: 20,
                  background: '#05603C',
                  borderBottom: '1px solid rgba(255,255,255,0.12)',
                }}>
                  <div className="ranking-subheading-spacer" style={{ width: 32, flexShrink: 0 }} />
                  <div style={{
                    flex: 1,
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: 'var(--qg-cream)',
                  }}>Nome</div>
                  <div style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: 'var(--qg-cream)',
                  }}>Pontos</div>
                </div>
              )}

              {/* Evolution view */}
              {view === 'evolution' && (
                <div className="ranking-chart-scroll" style={{ padding: '16px 0' }}>
                  <div>
                    <RankingChart hideHeader noCard />
                  </div>
                </div>
              )}

              {/* Positions view */}
              {view === 'positions' && ranked.map((player, i) => {
                const config = photoMap[player.name];
                const isFirst = i === 0;
                return (
                  <div key={player.name} className="ranking-row" style={{
                    position: 'relative',
                    height: 92,
                    background: '#fff',
                    overflow: 'hidden',
                    borderBottom: i < ranked.length - 1 ? '1px solid var(--qg-line)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {/* Camada 1 — foto */}
                    {config ? (
                      <div style={{ position: 'absolute', right: -(config.offsetX ?? 0), top: 0, bottom: 0, width: config.width ?? 574, zIndex: 0 }}>
                        <Image
                          src={config.src}
                          alt=""
                          fill
                          sizes="340px"
                          style={{ objectFit: 'cover', objectPosition: config.pos, transform: config.flipX ? 'scaleX(-1)' : undefined }}
                        />
                      </div>
                    ) : (
                      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 574, zIndex: 0, background: 'var(--qg-green)' }} />
                    )}

                    {/* Camada 2 — fade branco */}
                    <div style={{
                      position: 'absolute', inset: 0, zIndex: 1,
                      background: 'linear-gradient(to right, #fff 70%, transparent 82.5%)',
                    }} />

                    {/* Left accent bar for top 3 */}
                    {i < 3 && (
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, zIndex: 2,
                        background: i === 0 ? '#D19D00' : i === 1 ? '#6A7282' : '#D35220',
                      }} />
                    )}

                    {/* Camada 3 — conteúdo */}
                    <div className="ranking-row-content" style={{
                      position: 'relative', zIndex: 3,
                      display: 'flex', alignItems: 'center',
                      width: '100%', padding: '0 24px', gap: 20,
                    }}>
                      {/* Position */}
                      <div className="ranking-row-pos" style={{ width: 32, flexShrink: 0 }}>
                        <PosBadge pos={i + 1} />
                      </div>

                      {/* Name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ranking-row-name-first" style={{
                          fontFamily: 'var(--qg-font-display)', fontSize: 15, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                          color: 'var(--qg-fg-1)',
                        }}>
                          {player.name.split(' ')[0]}
                        </div>
                        <div className="ranking-row-name-last" style={{
                          fontFamily: 'var(--qg-font-display)', fontSize: 11,
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                          color: 'var(--qg-fg-3)', marginTop: 2,
                        }}>
                          {player.name.split(' ').slice(1).join(' ')}
                        </div>
                      </div>

                      {/* Points */}
                      <div className="ranking-row-points" style={{
                        fontFamily: 'var(--qg-font-display)', fontSize: 22, fontWeight: 700,
                        color: '#fff',
                        letterSpacing: '0.02em', flexShrink: 0,
                      }}>
                        {player.totalPoints || 0}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Upcoming edition notice */}
            {upcomingIds.length > 0 && (
              <div style={{
                marginTop: 16, padding: '12px 16px',
                background: 'var(--qg-clay-wash)', borderRadius: 'var(--qg-radius-md)',
                fontSize: 13, color: 'var(--qg-clay-deep)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{
                  fontFamily: 'var(--qg-font-display)', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'var(--qg-clay)', color: 'var(--qg-cream)',
                  padding: '2px 8px', borderRadius: 2,
                }}>Em breve</span>
                2ª Edição prevista para <strong>27/04/2026</strong>. Os pontos serão adicionados após o encerramento.
              </div>
            )}

            {/* Points reference */}
            <div style={{
              marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--qg-line)',
              fontSize: 11, color: 'var(--qg-fg-3)', letterSpacing: '0.02em',
            }}>
              <span style={{ fontWeight: 600, marginRight: 6, color: 'var(--qg-fg-2)' }}>Pontuação:</span>
              Campeão 100 · Vice 80 · 3º-4º 65 · 5º 50 · 6º 40 · 7º-8º 30 · 9º-12º 15
            </div>
          </>
        </>
      </div>
      <Footer />
    </>
  );
}
