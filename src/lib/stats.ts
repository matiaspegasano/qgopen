import type { Game, GroupMatch } from './data';

function getWinner(g: Game): 'p1' | 'p2' | null {
  if (g.result.startsWith('WO') || g.result.startsWith('Ab.')) {
    const winner = g.result.split('—')[1]?.trim();
    if (!winner) return null;
    return g.p1 === winner ? 'p1' : 'p2';
  }
  const sets = g.result.split(',');
  let p1 = 0, p2 = 0;
  for (const s of sets) {
    const clean = s.trim().replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '');
    const [a, b] = clean.split('-').map(Number);
    if (!isNaN(a) && !isNaN(b)) { if (a > b) p1++; else p2++; }
  }
  return p1 > p2 ? 'p1' : p2 > p1 ? 'p2' : null;
}

/** Computes wins/losses for a player from the games array. */
export function computeWinsLosses(
  playerName: string,
  editionIds: number | number[] | null,
  gamesList: Game[]
): { wins: number; losses: number } {
  const ids = editionIds === null ? null
    : Array.isArray(editionIds) ? editionIds
    : [editionIds];
  let wins = 0, losses = 0;
  for (const g of gamesList) {
    if (ids !== null && !ids.includes(g.edition)) continue;
    if (g.p1 !== playerName && g.p2 !== playerName) continue;
    const winner = getWinner(g);
    if (!winner) continue;
    const isP1 = g.p1 === playerName;
    if ((winner === 'p1' && isP1) || (winner === 'p2' && !isP1)) wins++;
    else losses++;
  }
  return { wins, losses };
}

/**
 * Derives provisional ranking points for an edition from group standings + bracket matches.
 * Awards 3 pts per group win, 1 per loss (group stage only), then adds bracket bonuses.
 * Intended for active editions where editionPoints is not yet filled in.
 */
export function computeProvisionalPoints(
  editionId: number,
  groupMatchesByEdition: Record<number, Record<string, GroupMatch[]>>,
  gamesList: Game[]
): Record<string, number> {
  const groups = groupMatchesByEdition[editionId];
  if (!groups) return {};

  const pts: Record<string, number> = {};
  const add = (name: string, n: number) => { pts[name] = (pts[name] ?? 0) + n; };

  // Group stage: 3 pts per win, 1 per loss (no pts for WO received)
  Object.values(groups).flat().forEach(m => {
    if (m.winner === undefined) return;
    const w = m.winner === 1 ? m.p1.name : m.p2.name;
    const l = m.winner === 1 ? m.p2.name : m.p1.name;
    add(w, 3);
    if (!m.wo) add(l, 1);
  });

  // Bracket: 5 pts per win (main or consolation)
  gamesList.filter(g => g.edition === editionId && (
    g.phase === 'Quartas de Final' || g.phase === 'Semifinais' ||
    g.phase === 'Chave Consolação' || g.phase === 'Finais'
  )).forEach(g => {
    const winner = getWinner(g);
    if (!winner) return;
    add(winner === 'p1' ? g.p1 : g.p2, 5);
  });

  return pts;
}
