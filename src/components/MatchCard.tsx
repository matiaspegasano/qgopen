import type { SetScore } from '@/lib/data';

type PlayerInfo = { seed?: number; name: string };

function ScoreCell({ v, lose }: { v: SetScore | '—' | null; lose: boolean }) {
  const cls = 'match-row-score' + (lose ? ' loss' : '');
  if (v == null || v === '—') return <div className={cls}>—</div>;
  if (typeof v === 'object') {
    return <div className={cls}>{v.main}<sup>{v.tb}</sup></div>;
  }
  return <div className={cls}>{v}</div>;
}

function PlayerRow({
  player, scores, winner, loss, wo,
}: {
  player: PlayerInfo;
  scores: (SetScore | '—')[];
  winner: boolean;
  loss: boolean;
  wo?: boolean;
}) {
  const padded = [...scores];
  while (padded.length < 3) padded.push('—');
  return (
    <div className="match-row">
      <div className="match-row-player">
        {player.seed != null && <span className="match-row-seed">{player.seed}</span>}
        <span className={'match-row-name' + (loss ? ' loss' : '')}>{player.name}</span>
        {winner && <span className="match-row-check">✓</span>}
        {wo && <span className="pill pill-wo">WO</span>}
      </div>
      {padded.map((s, i) => <ScoreCell key={i} v={s} lose={loss} />)}
    </div>
  );
}

interface MatchCardProps {
  round: string;
  dates: string;
  p1: PlayerInfo;
  p2: PlayerInfo;
  scores1: (SetScore | '—')[];
  scores2: (SetScore | '—')[];
  winner: 1 | 2 | null;
  wo?: 1 | 2;
  isFinal?: boolean;
}

export default function MatchCard({
  round, dates, p1, p2, scores1, scores2, winner, wo, isFinal,
}: MatchCardProps) {
  return (
    <div className="card">
      <div className={'card-header' + (isFinal ? ' card-header-clay' : '')}>
        {round} <span className="card-dot">•</span> {dates}
      </div>
      <PlayerRow player={p1} scores={scores1} winner={winner === 1} loss={winner === 2} wo={wo === 1} />
      <PlayerRow player={p2} scores={scores2} winner={winner === 2} loss={winner === 1} wo={wo === 2} />
    </div>
  );
}
