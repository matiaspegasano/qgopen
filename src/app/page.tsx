'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { editions, games, groupMatchesByEdition, mainBracketE2, consolationBracketE2, type BracketMatch } from '@/lib/data';

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function isRoundAvailable(dates: string): boolean {
  const startPart = dates.split(' - ')[0];
  const [day, month] = startPart.split('/').map(Number);
  const start = new Date(2026, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= start;
}

function isRoundExpired(dates: string): boolean {
  const parts = dates.split(' - ');
  if (parts.length < 2) return false;
  const [day, month] = parts[1].split('/').map(Number);
  const end = new Date(2026, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today > end;
}

function SectionHead({ eyebrow, title, meta }: { eyebrow: string; title: string; meta?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--qg-clay)', marginBottom: 4 }}>
          {eyebrow}
        </div>
        <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 26, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--qg-fg-1)', lineHeight: 1 }}>
          {title}
        </div>
      </div>
      {meta && (
        <span style={{ fontSize: 12, color: 'var(--qg-fg-4)', letterSpacing: '0.06em', paddingBottom: 2 }}>
          {meta}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* COMPONENTS                                                          */
/* ------------------------------------------------------------------ */

function MatchPosterCard({ m, group }: { m: any; group: string }) {
  const p1Parts = (m.p1.name as string).split(' ');
  const p2Parts = (m.p2.name as string).split(' ');
  const scheduledAt: string | undefined = m.scheduledAt;
  const location: string | undefined    = m.location;

  return (
    <div style={{
      background: 'var(--qg-green)',
      borderRadius: 'var(--qg-radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--qg-shadow-3)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 28px',
        borderBottom: '1px solid rgba(234,241,236,0.1)',
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(234,241,236,0.45)' }}>
          {m.round}{group ? ` · Grupo ${group}` : ''}
        </span>
        {scheduledAt && (
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(234,241,236,0.6)' }}>
            {scheduledAt}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr', alignItems: 'center', padding: '36px 28px', gap: 0 }}>
        <div>
          <div style={{ fontFamily: 'var(--qg-font-display)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.01em', lineHeight: 0.9 }}>
            <div style={{ fontSize: 40, color: 'var(--qg-cream)' }}>{p1Parts[0]}</div>
            {p1Parts.length > 1 && <div style={{ fontSize: 20, color: 'rgba(234,241,236,0.45)', marginTop: 2 }}>{p1Parts.slice(1).join(' ')}</div>}
          </div>
          <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(234,241,236,0.08)', borderRadius: 'var(--qg-radius-sm)', padding: '3px 9px' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(234,241,236,0.5)', letterSpacing: '0.06em' }}>Seed {m.p1.seed}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700, color: 'var(--qg-clay)' }}>×</div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--qg-font-display)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.01em', lineHeight: 0.9 }}>
            <div style={{ fontSize: 40, color: 'var(--qg-cream)' }}>{p2Parts[0]}</div>
            {p2Parts.length > 1 && <div style={{ fontSize: 20, color: 'rgba(234,241,236,0.45)', marginTop: 2 }}>{p2Parts.slice(1).join(' ')}</div>}
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(234,241,236,0.08)', borderRadius: 'var(--qg-radius-sm)', padding: '3px 9px' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(234,241,236,0.5)', letterSpacing: '0.06em' }}>Seed {m.p2.seed}</span>
            </div>
          </div>
        </div>
      </div>

      {location && (
        <div style={{ padding: '0 28px 16px', fontSize: 11, color: 'rgba(234,241,236,0.4)', letterSpacing: '0.04em' }}>
          {location}
        </div>
      )}
    </div>
  );
}

type BracketCol = { col: number; ghost?: boolean; matches: BracketMatch[] };

function pendingBracketMatches(cols: BracketCol[]): BracketMatch[] {
  // Semis only unlocked after every QF in both flanking columns is decided
  const allQfsDone = [0, 4].every(qfCol => {
    const c = cols.find(x => x.col === qfCol);
    return !!c && c.matches.every(m => !!m.p1.w || !!m.p2.w);
  });
  return cols.flatMap(col =>
    col.matches.filter(m =>
      !m.p1.w && !m.p2.w &&
      !isRoundExpired(m.dates) &&
      m.p1.name !== 'A definir' &&
      m.p2.name !== 'A definir' &&
      (!m.round.toLowerCase().includes('semi') || allQfsDone)
    )
  );
}

function BracketSection({ label, matches }: { label: string; matches: BracketMatch[] }) {
  if (matches.length === 0) return null;
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--qg-fg-3)', paddingBottom: 10, marginBottom: 14,
        borderBottom: '1px solid var(--qg-line)',
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {matches.map(m => <MatchPosterCard key={m.id} m={m} group="" />)}
      </div>
    </div>
  );
}

function UpcomingMatches() {
  const activeEdition = editions.find(e => e.status === 'active');
  if (!activeEdition) return null;
  const allGroups = groupMatchesByEdition[activeEdition.id] ?? {};

  const groupUpcoming = Object.entries(allGroups).flatMap(([group, matches]) =>
    matches
      .filter(m => m.winner === undefined && !isRoundExpired(m.dates))
      .map(m => ({ ...m, group }))
  );

  const mainUpcoming   = activeEdition.id === 2 ? pendingBracketMatches(mainBracketE2) : [];
  const consolUpcoming = activeEdition.id === 2 ? pendingBracketMatches(consolationBracketE2) : [];

  const hasAny = groupUpcoming.length > 0 || mainUpcoming.length > 0 || consolUpcoming.length > 0;

  if (!hasAny) {
    return (
      <div style={{ padding: '28px 0', fontSize: 13, color: 'var(--qg-fg-4)', letterSpacing: '0.04em' }}>
        Nenhuma partida pendente.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {groupUpcoming.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--qg-fg-3)', paddingBottom: 10, marginBottom: 14,
            borderBottom: '1px solid var(--qg-line)',
          }}>
            Fase de Grupos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groupUpcoming.map(m => <MatchPosterCard key={m.id} m={m} group={m.group} />)}
          </div>
        </div>
      )}
      <BracketSection label="Chave Principal" matches={mainUpcoming} />
      <BracketSection label="Chave Consolação" matches={consolUpcoming} />
    </div>
  );
}

function parseWinner(g: (typeof games)[0]): 'p1' | 'p2' | null {
  if (g.wo) {
    const after = g.result.split('—')[1]?.trim() ?? '';
    const p1first = g.p1.split(' ')[0];
    return p1first && after.includes(p1first) ? 'p1' : 'p2';
  }
  const sets = g.result.split(',').map(s => {
    const m = s.trim().match(/^(\d+)[^-\d]*-(\d+)/);
    return m ? [parseInt(m[1]), parseInt(m[2])] as [number, number] : null;
  }).filter((x): x is [number, number] => x !== null);
  const p1sets = sets.filter(([a, b]) => a > b).length;
  const p2sets = sets.filter(([a, b]) => b > a).length;
  return p1sets > p2sets ? 'p1' : p2sets > p1sets ? 'p2' : null;
}

function parseSetScores(result: string): [number, number][] {
  return result.split(',').map(s => {
    const m = s.trim().match(/^(\d+)[^-\d]*-(\d+)/);
    return m ? [parseInt(m[1]), parseInt(m[2])] as [number, number] : null;
  }).filter((x): x is [number, number] => x !== null);
}

function GameRow({ g, last }: { g: (typeof games)[0]; last: boolean }) {
  const winner = parseWinner(g);
  const sets   = g.wo ? [[6, 0], [6, 0]] as [number, number][] : parseSetScores(g.result);

  const dot = (side: 'p1' | 'p2') => (
    <div style={{
      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
      background: winner === side ? 'var(--qg-green)' : 'transparent',
      border: winner !== side ? '1.5px solid var(--qg-line-strong)' : 'none',
    }} />
  );

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderBottom: last ? 'none' : '1px solid var(--qg-line)',
      borderLeft: '3px solid var(--qg-line-strong)',
    }}>
      {/* Date */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '16px 18px', borderRight: '1px solid var(--qg-line)',
        minWidth: 60, flexShrink: 0,
      }}>
        <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 24, fontWeight: 700, color: 'var(--qg-fg-1)', lineHeight: 1 }}>{g.day}</div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--qg-fg-3)', textTransform: 'uppercase', marginTop: 2 }}>{g.month}</div>
      </div>

      {/* CSS grid: names col + scores col, round label spanning both */}
      <div style={{
        flex: 1, minWidth: 0,
        display: 'grid', gridTemplateColumns: '1fr auto',
        columnGap: 24, rowGap: 5, alignItems: 'center',
        padding: '12px 24px 12px 20px',
      }}>
        {/* Round label */}
        <div style={{ gridColumn: '1 / -1', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--qg-fg-4)', paddingBottom: 4 }}>
          {g.round}
        </div>

        {/* P1 name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {dot('p1')}
          <span style={{
            fontFamily: 'var(--qg-font-display)', fontSize: 14,
            fontWeight: winner === 'p1' ? 700 : 400,
            color: winner === 'p2' ? 'var(--qg-fg-3)' : 'var(--qg-fg-1)',
            textTransform: 'uppercase', letterSpacing: '0.02em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{g.p1}</span>
          {g.wo && winner === 'p2' && (
            <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--qg-clay)', background: 'rgba(211,82,32,0.12)', borderRadius: 3, padding: '2px 5px' }}>W.O.</span>
          )}
        </div>

        {/* P1 scores */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {sets.map(([s1, s2], i) => (
            <span key={i} style={{ fontFamily: 'var(--qg-font-display)', fontSize: 18, fontWeight: s1 > s2 ? 700 : 400, color: s1 > s2 ? 'var(--qg-fg-1)' : 'var(--qg-fg-4)', fontVariantNumeric: 'tabular-nums', minWidth: '1.2em', textAlign: 'center', lineHeight: 1 }}>{s1}</span>
          ))}
        </div>

        {/* P2 name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {dot('p2')}
          <span style={{
            fontFamily: 'var(--qg-font-display)', fontSize: 14,
            fontWeight: winner === 'p2' ? 700 : 400,
            color: winner === 'p1' ? 'var(--qg-fg-3)' : 'var(--qg-fg-1)',
            textTransform: 'uppercase', letterSpacing: '0.02em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{g.p2}</span>
          {g.wo && winner === 'p1' && (
            <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--qg-clay)', background: 'rgba(211,82,32,0.12)', borderRadius: 3, padding: '2px 5px' }}>W.O.</span>
          )}
        </div>

        {/* P2 scores */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {sets.map(([s1, s2], i) => (
            <span key={i} style={{ fontFamily: 'var(--qg-font-display)', fontSize: 18, fontWeight: s2 > s1 ? 700 : 400, color: s2 > s1 ? 'var(--qg-fg-1)' : 'var(--qg-fg-4)', fontVariantNumeric: 'tabular-nums', minWidth: '1.2em', textAlign: 'center', lineHeight: 1 }}>{s2}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const GROUP_TABS = ['A', 'B', 'C', 'D'] as const;
type GroupTab = typeof GROUP_TABS[number];

const BRACKET_PHASES = ['Quartas de Final', 'Semifinais', 'Finais'] as const;
type BracketPhase = typeof BRACKET_PHASES[number];
const BRACKET_LABELS: Record<BracketPhase, string> = {
  'Quartas de Final': 'Quartas',
  'Semifinais': 'Semifinais',
  'Finais': 'Final',
};

function PendingRow({ m, last }: { m: BracketMatch; last: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderBottom: last ? 'none' : '1px solid var(--qg-line)',
      borderLeft: '3px solid var(--qg-line-strong)',
      opacity: 0.6,
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '16px 18px', borderRight: '1px solid var(--qg-line)',
        minWidth: 60, flexShrink: 0,
      }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--qg-fg-4)', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.5 }}>
          A<br/>jogar
        </div>
      </div>
      <div style={{
        flex: 1, minWidth: 0,
        display: 'grid', gridTemplateColumns: '1fr auto',
        columnGap: 24, rowGap: 5, alignItems: 'center',
        padding: '12px 24px 12px 20px',
      }}>
        <div style={{ gridColumn: '1 / -1', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--qg-fg-4)', paddingBottom: 4 }}>
          {m.round}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', border: '1.5px solid var(--qg-line-strong)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--qg-font-display)', fontSize: 14, fontWeight: 400, color: 'var(--qg-fg-2)', textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.p1.name}</span>
        </div>
        <div />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', border: '1.5px solid var(--qg-line-strong)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--qg-font-display)', fontSize: 14, fontWeight: 400, color: 'var(--qg-fg-2)', textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.p2.name}</span>
        </div>
        <div />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 18px',
      borderRadius: 'var(--qg-radius-sm)',
      border: '1px solid var(--qg-line)',
      background: active ? 'var(--qg-fg-1)' : 'transparent',
      color: active ? 'var(--qg-bg)' : 'var(--qg-fg-2)',
      fontWeight: 700, fontSize: 12, cursor: 'pointer',
      letterSpacing: '0.06em', transition: 'background 120ms, color 120ms',
    }}>
      {children}
    </button>
  );
}

function GameList({ rows }: { rows: (typeof games) }) {
  if (rows.length === 0) return (
    <div style={{ padding: '28px 24px', fontSize: 13, color: 'var(--qg-fg-4)', letterSpacing: '0.04em' }}>Nenhum resultado ainda.</div>
  );
  return <>{rows.map((g, i) => <GameRow key={g.id} g={g} last={i === rows.length - 1} />)}</>;
}

function RecentResults() {
  const [groupTab,    setGroupTab]    = useState<GroupTab>('A');
  const [mainPhase,   setMainPhase]   = useState<BracketPhase>('Quartas de Final');
  const [consolPhase, setConsolPhase] = useState<BracketPhase>('Quartas de Final');

  const activeEditionId = editions.find(e => e.status === 'active')?.id;
  const edGames = games.filter(g => g.edition === activeEditionId);
  if (edGames.length === 0) return null;

  const groupGames = (t: GroupTab) =>
    edGames.filter(g => g.phase === 'Fase de Grupos' && g.round.includes(`Grupo ${t}`)).reverse();

  const isConsolation = (id: string) => /^e\d+-c/.test(id);
  const bracketAll = edGames.filter(g => g.phase !== 'Fase de Grupos');

  const playedBracket = (phase: BracketPhase, consol: boolean) =>
    bracketAll.filter(g => g.phase === phase && (consol ? isConsolation(g.id) : !isConsolation(g.id))).reverse();

  const pendingQF = (consol: boolean): BracketMatch[] => {
    if (activeEditionId !== 2) return [];
    const data = consol ? consolationBracketE2 : mainBracketE2;
    return data
      .filter(c => c.col === 0 || c.col === 4)
      .flatMap(c => c.matches)
      .filter(m => !m.p1.w && !m.p2.w && m.p1.name !== 'A definir' && m.p2.name !== 'A definir');
  };

  const hasBracket = bracketAll.length > 0 || pendingQF(false).length > 0 || pendingQF(true).length > 0;

  const sectionLabel = (label: string) => (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', paddingBottom: 10, marginBottom: 14, borderBottom: '1px solid var(--qg-line)' }}>
      {label}
    </div>
  );

  const renderBracket = (label: string, phase: BracketPhase, setPhase: (p: BracketPhase) => void, consol: boolean) => {
    const played  = playedBracket(phase, consol);
    const pending = phase === 'Quartas de Final' ? pendingQF(consol) : [];
    const isEmpty = played.length === 0 && pending.length === 0;
    return (
      <div>
        {sectionLabel(label)}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {BRACKET_PHASES.map(p => (
            <TabButton key={p} active={phase === p} onClick={() => setPhase(p)}>{BRACKET_LABELS[p]}</TabButton>
          ))}
        </div>
        <div style={{ background: 'var(--qg-bg-elev)', border: '1px solid var(--qg-line)', borderRadius: 'var(--qg-radius-md)', overflow: 'hidden' }}>
          {isEmpty
            ? <div style={{ padding: '28px 24px', fontSize: 13, color: 'var(--qg-fg-4)', letterSpacing: '0.04em' }}>Nenhum resultado ainda.</div>
            : <>
                {played.map((g, i) => <GameRow key={g.id} g={g} last={pending.length === 0 && i === played.length - 1} />)}
                {pending.map((m, i) => <PendingRow key={m.id} m={m} last={i === pending.length - 1} />)}
              </>
          }
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Fase de Grupos ── */}
      <div style={{ display: 'flex', gap: 6 }}>
        {GROUP_TABS.map(t => (
          <TabButton key={t} active={groupTab === t} onClick={() => setGroupTab(t)}>Grupo {t}</TabButton>
        ))}
      </div>
      <div style={{ background: 'var(--qg-bg-elev)', border: '1px solid var(--qg-line)', borderRadius: 'var(--qg-radius-md)', overflow: 'hidden' }}>
        <GameList rows={groupGames(groupTab)} />
      </div>

      {/* ── Eliminatórias ── */}
      {hasBracket && (
        <>
          <div style={{ marginTop: 8 }}>
            {renderBracket('Chave Principal', mainPhase, setMainPhase, false)}
          </div>
          <div>
            {renderBracket('Chave Consolação', consolPhase, setConsolPhase, true)}
          </div>
        </>
      )}

    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div>
          <div className="hero-eyebrow">Alphaville · São Paulo</div>
          <h1>QG OPEN<span className="sub">2026</span></h1>
          <p className="hero-desc">
            Campeonato amador de tênis nos condomínios de Alphaville.
          </p>
          <div className="hero-actions">
            <Link href="/draws" className="btn btn-outline-light">Ver chaves</Link>
            <Link href="/ranking" className="btn btn-ghost">Ranking final</Link>
          </div>
        </div>
        <div className="hero-badge">
          <Image src="/logo.png" alt="QG Open" width={280} height={280} priority />
        </div>
      </section>

      {/* Stats strip */}
      {(() => {
        const completed    = editions.filter(e => e.status === 'completed');
        const totalMatches = completed.reduce((s, e) => s + (e.stats?.matches ?? 0), 0);
        const allNames     = new Set<string>();
        Object.values(groupMatchesByEdition).forEach(edGroups =>
          Object.values(edGroups).forEach(ms =>
            ms.forEach(m => { allNames.add(m.p1.name); allNames.add(m.p2.name); })
          )
        );
        const uniquePlayers = allNames.size;
        const lastChampion  = [...completed].reverse().find(e => e.champion)?.champion ?? '—';
        return (
          <div className="stats-strip">
            <div className="stat-item"><div className="stat-num">{editions.length}</div><div className="stat-lbl">Edições</div></div>
            <div className="stat-item"><div className="stat-num">{uniquePlayers}</div><div className="stat-lbl">Participantes QG Open</div></div>
            <div className="stat-item"><div className="stat-num">{totalMatches}</div><div className="stat-lbl">Partidas disputadas</div></div>
            <div className="stat-item"><div className="stat-num" style={{ textTransform: 'uppercase' }}>{lastChampion}</div><div className="stat-lbl">Último campeão</div></div>
          </div>
        );
      })()}

      <div className="page" style={{ paddingTop: 64, display: 'flex', flexDirection: 'column', gap: 56 }}>

        {/* Próximas partidas */}
        <section>
          <SectionHead eyebrow="2ª Edição · Em andamento" title="Próximas Partidas" />
          <UpcomingMatches />
        </section>

        {/* Todos os resultados */}
        {(() => {
          const activeEditionId = editions.find(e => e.status === 'active')?.id;
          const activeGames = games.filter(g => g.edition === activeEditionId);
          return (
            <section>
              <SectionHead eyebrow="Histórico do campeonato" title="Resultados" meta={`${activeGames.length} partidas`} />
              <RecentResults />
            </section>
          );
        })()}

      </div>

      <Footer />
    </>
  );
}
