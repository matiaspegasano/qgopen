import {
  mainBracket, consolationBracket, bronzeMatch,
  mainBracketE2, consolationBracketE2, bronzeE2, consolationBronzeE2,
  type BracketMatch,
} from '@/lib/data';

export function getBracketMatch(matchId: string): BracketMatch | null {
  const all: BracketMatch[] = [
    ...mainBracket.flatMap(c => c.matches),
    ...consolationBracket.filter(c => !c.ghost).flatMap(c => c.matches),
    bronzeMatch,
    ...mainBracketE2.flatMap(c => c.matches),
    ...consolationBracketE2.filter(c => !c.ghost).flatMap(c => c.matches),
    bronzeE2,
    consolationBronzeE2,
  ];
  return all.find(m => m.id === matchId) ?? null;
}

// Parses '26/05 - 01/06' (year 2026) into ['2026-05-26', ..., '2026-06-01']
export function parseMatchWindow(dates: string): string[] {
  const [startStr, endStr] = dates.split(' - ');
  const [sd, sm] = startStr.split('/').map(Number);
  const [ed, em] = (endStr ?? startStr).split('/').map(Number);
  const start = new Date(2026, sm - 1, sd);
  const end   = new Date(2026, em - 1, ed);
  const result: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    result.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

// Hourly slots available for selection: '07:00' … '22:00'
export const HOURS = Array.from({ length: 16 }, (_, i) =>
  `${String(i + 7).padStart(2, '0')}:00`
);

// Format a YYYY-MM-DD string to human-readable 'Seg, 26 Mai'
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAY_NAMES[date.getDay()]}, ${d} ${MONTH_NAMES[m - 1]}`;
}

// Finds consecutive overlap blocks of >= minHours between two slot arrays
export function findOverlaps(
  slots1: string[],
  slots2: string[],
  minHours = 2
): { start: string; end: string; durationH: number; hours: string[] }[] {
  const h = (s: string) => parseInt(s.split(':')[0]);
  const common = slots1.filter(s => slots2.includes(s)).sort();
  const blocks: { start: string; end: string; durationH: number; hours: string[] }[] = [];
  let i = 0;
  while (i < common.length) {
    let j = i;
    while (j + 1 < common.length && h(common[j + 1]) === h(common[j]) + 1) j++;
    const seq = common.slice(i, j + 1);
    if (seq.length >= minHours) {
      blocks.push({
        start: seq[0],
        end: `${String(h(seq[seq.length - 1]) + 1).padStart(2, '0')}:00`,
        durationH: seq.length,
        hours: seq,
      });
    }
    i = j + 1;
  }
  return blocks;
}
