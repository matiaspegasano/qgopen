export type SetScore = number | { main: number; tb: number };

export type Edition = {
  id: number;
  label: string;
  shortLabel: string;
  year: string;
  status: 'completed' | 'active' | 'upcoming';
  startDate: string;
  endDate?: string;
  stats?: {
    players: number;
    groups: number;
    matches: number;
  };
  champion?: string;
};

export const editions: Edition[] = [
  {
    id: 1,
    label: '1ª Edição',
    shortLabel: '1ª Edição',
    year: '2026',
    status: 'completed',
    startDate: '02/03/2026',
    endDate: '12/04/2026',
    stats: { players: 12, groups: 4, matches: 22 },
    champion: 'Matias',
  },
  {
    id: 2,
    label: '2ª Edição',
    shortLabel: '2ª Edição',
    year: '2026',
    status: 'active',
    startDate: '27/04/2026',
    stats: { players: 16, groups: 4, matches: 24 },
  },
];

/* Points per edition per player name */
export const editionPoints: Record<number, Record<string, number>> = {
  1: {
    'Matias Pegasano':    100,
    'Guilherme Puccini':   80,
    'Mateus Palhares':     65,
    'Luiz Guilherme':      65,
    'Marcus Ribeiro':      50,
    'Silas Neto':          40,
    'Guilherme Meismith':  30,
    'Lucas Chequer':       30,
    'Leo Souza':           15,
    'Arthur Donegá':       15,
    'Caio Bessa':          15,
    'Gabriel Holzmann':    15,
  },
  2: {},
};

export type Player = {
  seed: number;
  name: string;
  group: 'A' | 'B' | 'C' | 'D';
  finalPos: number;
  finalPoints: number;
  finalResult: string;
};

export type GroupMatch = {
  id: string;
  round: string;
  dates: string;
  scheduledAt?: string;
  location?: string;
  p1: { seed: number; name: string };
  p2: { seed: number; name: string };
  scores1: (SetScore | '—')[];
  scores2: (SetScore | '—')[];
  winner?: 1 | 2;
  wo?: 1 | 2;
};

export type BracketMatch = {
  id: string;
  round: string;
  dates: string;
  p1: { seed: number; name: string; w?: boolean; wo?: boolean; s: (SetScore | '—')[] };
  p2: { seed: number; name: string; w?: boolean; wo?: boolean; s: (SetScore | '—')[] };
};

export type Game = {
  id: string;
  edition: number;
  phase: string;
  round: string;
  day: string;
  month: string;
  date: string;
  p1: string;
  p2: string;
  result: string;
  wo?: boolean;
};

export const CURRENT_PLAYER = 'Matias Pegasano';
export const CURRENT_SEED = 1;

/* ------------------------------------------------------------------ */
/* PLAYERS                                                             */
/* ------------------------------------------------------------------ */
export const players: Player[] = [
  { seed: 1,  name: 'Matias Pegasano',       group: 'A', finalPos: 1,  finalPoints: 100, finalResult: 'Campeão'                       },
  { seed: 2,  name: 'Guilherme Puccini',  group: 'B', finalPos: 2,  finalPoints: 80,  finalResult: 'Vice-campeão'                  },
  { seed: 3,  name: 'Mateus Palhares',        group: 'D', finalPos: 3,  finalPoints: 65,  finalResult: 'Semi-finalista'                },
  { seed: 4,  name: 'Luiz Guilherme',         group: 'C', finalPos: 4,  finalPoints: 65,  finalResult: 'Semi-finalista'                },
  { seed: 5,  name: 'Marcus Ribeiro',       group: 'A', finalPos: 5,  finalPoints: 50,  finalResult: 'Campeão da consolação'         },
  { seed: 6,  name: 'Silas Neto',        group: 'B', finalPos: 6,  finalPoints: 40,  finalResult: 'Vice da consolação'            },
  { seed: 7,  name: 'Guilherme Meismith', group: 'D', finalPos: 7,  finalPoints: 30,  finalResult: 'Semi-finalista da consolação'  },
  { seed: 8,  name: 'Lucas Chequer',      group: 'C', finalPos: 8,  finalPoints: 30,  finalResult: 'Semi-finalista da consolação'  },
  { seed: 9,  name: 'Leo Souza',      group: 'A', finalPos: 9,  finalPoints: 15,  finalResult: '3º do grupo'                  },
  { seed: 10, name: 'Arthur Donegá',       group: 'B', finalPos: 10, finalPoints: 15,  finalResult: '3º do grupo'                  },
  { seed: 11, name: 'Caio Bessa',         group: 'D', finalPos: 11, finalPoints: 15,  finalResult: '3º do grupo'                  },
  { seed: 12, name: 'Gabriel Holzmann',         group: 'C', finalPos: 12, finalPoints: 15,  finalResult: '3º do grupo'                  },
];

/* ------------------------------------------------------------------ */
/* GROUP MATCHES                                                       */
/* ------------------------------------------------------------------ */
export const groupMatches: Record<string, GroupMatch[]> = {
  A: [
    {
      id: 'a1', round: '1ª Rodada', dates: '02/03 - 08/03',
      p1: { seed: 1, name: 'Matias Pegasano' },
      p2: { seed: 5, name: 'Marcus Ribeiro' },
      scores1: [6, { main: 7, tb: 7 }, '—'],
      scores2: [3, { main: 6, tb: 4 }, '—'],
      winner: 1,
    },
    {
      id: 'a2', round: '2ª Rodada', dates: '09/03 - 15/03',
      p1: { seed: 1, name: 'Matias Pegasano' },
      p2: { seed: 9, name: 'Leo Souza' },
      scores1: [6, 6, '—'],
      scores2: [1, 0, '—'],
      winner: 1,
    },
    {
      id: 'a3', round: '3ª Rodada', dates: '16/03 - 22/03',
      p1: { seed: 5, name: 'Marcus Ribeiro' },
      p2: { seed: 9, name: 'Leo Souza' },
      scores1: [6, 6, '—'],
      scores2: [4, 1, '—'],
      winner: 1,
    },
  ],
  B: [
    {
      id: 'b1', round: '1ª Rodada', dates: '02/03 - 08/03',
      p1: { seed: 2, name: 'Guilherme Puccini' },
      p2: { seed: 6, name: 'Silas Neto' },
      scores1: [6, 6, '—'],
      scores2: [1, 2, '—'],
      winner: 1,
    },
    {
      id: 'b2', round: '2ª Rodada', dates: '09/03 - 15/03',
      p1: { seed: 2, name: 'Guilherme Puccini' },
      p2: { seed: 10, name: 'Arthur Donegá' },
      scores1: [6, 6, '—'],
      scores2: [1, 1, '—'],
      winner: 1,
    },
    {
      id: 'b3', round: '3ª Rodada', dates: '16/03 - 22/03',
      p1: { seed: 6, name: 'Silas Neto' },
      p2: { seed: 10, name: 'Arthur Donegá' },
      scores1: [6, 6, '—'],
      scores2: [0, 0, '—'],
      winner: 1,
      wo: 2,
    },
  ],
  C: [
    {
      id: 'c1', round: '1ª Rodada', dates: '02/03 - 08/03',
      p1: { seed: 4, name: 'Luiz Guilherme' },
      p2: { seed: 12, name: 'Gabriel Holzmann' },
      scores1: [6, 6, '—'],
      scores2: [1, 0, '—'],
      winner: 1,
    },
    {
      id: 'c2', round: '2ª Rodada', dates: '09/03 - 15/03',
      p1: { seed: 8, name: 'Lucas Chequer' },
      p2: { seed: 12, name: 'Gabriel Holzmann' },
      scores1: [6, 6, '—'],
      scores2: [1, 2, '—'],
      winner: 1,
    },
    {
      id: 'c3', round: '3ª Rodada', dates: '16/03 - 22/03',
      p1: { seed: 4, name: 'Luiz Guilherme' },
      p2: { seed: 8, name: 'Lucas Chequer' },
      scores1: [6, 6, '—'],
      scores2: [0, 0, '—'],
      winner: 1,
      wo: 2,
    },
  ],
  D: [
    {
      id: 'd1', round: '1ª Rodada', dates: '02/03 - 08/03',
      p1: { seed: 3, name: 'Mateus Palhares' },
      p2: { seed: 7, name: 'Guilherme Meismith' },
      scores1: [6, 6, '—'],
      scores2: [0, 1, '—'],
      winner: 1,
    },
    {
      id: 'd2', round: '2ª Rodada', dates: '09/03 - 15/03',
      p1: { seed: 3, name: 'Mateus Palhares' },
      p2: { seed: 11, name: 'Caio Bessa' },
      scores1: [6, 6, '—'],
      scores2: [2, 1, '—'],
      winner: 1,
    },
    {
      id: 'd3', round: '3ª Rodada', dates: '16/03 - 22/03',
      p1: { seed: 7, name: 'Guilherme Meismith' },
      p2: { seed: 11, name: 'Caio Bessa' },
      scores1: [6, 6, '—'],
      scores2: [0, 0, '—'],
      winner: 1,
      wo: 2,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* GROUP STANDINGS (pre-computed, verified against images)            */
/* ------------------------------------------------------------------ */
export const groupStandings: Record<string, {
  pos: string; seed: number; name: string;
  games: number; sets: number; pts: number;
}[]> = {
  A: [
    { pos: '1º', seed: 1, name: 'Matias Pegasano',  games: 15,  sets: 4,  pts: 6 },
    { pos: '2º', seed: 5, name: 'Marcus Ribeiro',  games: 3,   sets: 0,  pts: 3 },
    { pos: '3º', seed: 9, name: 'Leo Souza', games: -18, sets: -4, pts: 0 },
  ],
  B: [
    { pos: '1º', seed: 2,  name: 'Guilherme Puccini', games: 19,  sets: 4,  pts: 6 },
    { pos: '2º', seed: 6,  name: 'Silas Neto',        games: 3,   sets: 0,  pts: 3 },
    { pos: '3º', seed: 10, name: 'Arthur Donegá',       games: -22, sets: -4, pts: 0 },
  ],
  C: [
    { pos: '1º', seed: 4,  name: 'Luiz Guilherme',    games: 23,  sets: 4,  pts: 6 },
    { pos: '2º', seed: 8,  name: 'Lucas Chequer', games: -3,  sets: 0,  pts: 3 },
    { pos: '3º', seed: 12, name: 'Gabriel Holzmann',    games: -20, sets: -4, pts: 0 },
  ],
  D: [
    { pos: '1º', seed: 3,  name: 'Mateus Palhares',        games: 20,  sets: 4,  pts: 6 },
    { pos: '2º', seed: 7,  name: 'Guilherme Meismith', games: 1,   sets: 0,  pts: 3 },
    { pos: '3º', seed: 11, name: 'Caio Bessa',         games: -21, sets: -4, pts: 0 },
  ],
};

/* ------------------------------------------------------------------ */
/* MAIN BRACKET                                                        */
/* QF cruzamento: 1ºA×2ºB, 1ºB×2ºA, 1ºC×2ºD, 1ºD×2ºC               */
/* ------------------------------------------------------------------ */
export const mainBracket: { col: number; matches: BracketMatch[] }[] = [
  {
    col: 0,
    matches: [
      {
        id: 'qf1', round: 'Quarta de Final 1', dates: '23/03 - 29/03',
        p1: { seed: 1, name: 'Matias Pegasano',      w: true, s: [6, 6, '—'] },
        p2: { seed: 6, name: 'Silas Neto',                s: [1, 3, '—'] },
      },
      {
        id: 'qf3', round: 'Quarta de Final 3', dates: '23/03 - 29/03',
        p1: { seed: 4, name: 'Luiz Guilherme',        w: true, s: [6, 6, '—'] },
        p2: { seed: 7, name: 'Guilherme Meismith', wo: true, s: [0, 0, '—'] },
      },
    ],
  },
  {
    col: 1,
    matches: [
      {
        id: 'sf1', round: 'Semi-Final 1', dates: '30/03 - 05/04',
        p1: { seed: 1, name: 'Matias Pegasano', w: true, s: [6, 6, '—'] },
        p2: { seed: 4, name: 'Luiz Guilherme',           s: [2, 0, '—'] },
      },
    ],
  },
  {
    col: 2,
    matches: [
      {
        id: 'final', round: 'Final', dates: '12/04',
        p1: { seed: 1, name: 'Matias Pegasano',      w: true, s: [6, 4, 6] },
        p2: { seed: 2, name: 'Guilherme Puccini',         s: [4, 6, 2] },
      },
    ],
  },
  {
    col: 3,
    matches: [
      {
        id: 'sf2', round: 'Semi-Final 2', dates: '30/03 - 05/04',
        p1: { seed: 2, name: 'Guilherme Puccini', w: true, s: [7, 5, 6] },
        p2: { seed: 3, name: 'Mateus Palhares',               s: [5, 7, 1] },
      },
    ],
  },
  {
    col: 4,
    matches: [
      {
        id: 'qf2', round: 'Quarta de Final 2', dates: '23/03 - 29/03',
        p1: { seed: 2, name: 'Guilherme Puccini', w: true, s: [6, 6, '—'] },
        p2: { seed: 5, name: 'Marcus Ribeiro',              s: [4, 2, '—'] },
      },
      {
        id: 'qf4', round: 'Quarta de Final 4', dates: '23/03 - 29/03',
        p1: { seed: 3, name: 'Mateus Palhares',       w: true, s: [6, 6, '—'] },
        p2: { seed: 8, name: 'Lucas Chequer',     wo: true, s: [0, 0, '—'] },
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* CONSOLATION BRACKET                                                 */
/* Outer columns (0 and 4) are ghost — show QF context, grayed        */
/* ------------------------------------------------------------------ */
export const consolationBracket: { col: number; ghost?: boolean; matches: BracketMatch[] }[] = [
  {
    col: 0, ghost: true,
    matches: [
      {
        id: 'cqf1_ref', round: 'Quarta de Final 1', dates: '23/03 - 29/03',
        p1: { seed: 1, name: 'Matias Pegasano',      w: true, s: [6, 6, '—'] },
        p2: { seed: 6, name: 'Silas Neto',                s: [1, 3, '—'] },
      },
      {
        id: 'cqf3_ref', round: 'Quarta de Final 3', dates: '23/03 - 29/03',
        p1: { seed: 4, name: 'Luiz Guilherme',        w: true, s: [6, 6, '—'] },
        p2: { seed: 7, name: 'Guilherme Meismith', wo: true, s: [0, 0, '—'] },
      },
    ],
  },
  {
    col: 1,
    matches: [
      {
        id: 'csf1', round: 'Semi-Final 1', dates: '30/03 - 05/04',
        p1: { seed: 6, name: 'Silas Neto',        w: true, s: [6, 6, '—'] },
        p2: { seed: 7, name: 'Guilherme Meismith', wo: true, s: [0, 0, '—'] },
      },
    ],
  },
  {
    col: 2,
    matches: [
      {
        id: 'cfinal', round: 'Final', dates: '12/04',
        p1: { seed: 5, name: 'Marcus Ribeiro', w: true, s: [6, 6, '—'] },
        p2: { seed: 6, name: 'Silas Neto',          s: [3, 1, '—'] },
      },
    ],
  },
  {
    col: 3,
    matches: [
      {
        id: 'csf2', round: 'Semi-Final 2', dates: '30/03 - 05/04',
        p1: { seed: 5, name: 'Marcus Ribeiro',  w: true, s: [6, 6, '—'] },
        p2: { seed: 8, name: 'Lucas Chequer', wo: true, s: [0, 0, '—'] },
      },
    ],
  },
  {
    col: 4, ghost: true,
    matches: [
      {
        id: 'cqf2_ref', round: 'Quarta de Final 2', dates: '23/03 - 29/03',
        p1: { seed: 2, name: 'Guilherme Puccini', w: true, s: [6, 6, '—'] },
        p2: { seed: 5, name: 'Marcus Ribeiro',              s: [4, 2, '—'] },
      },
      {
        id: 'cqf4_ref', round: 'Quarta de Final 4', dates: '23/03 - 29/03',
        p1: { seed: 3, name: 'Mateus Palhares',       w: true, s: [6, 6, '—'] },
        p2: { seed: 8, name: 'Lucas Chequer',     wo: true, s: [0, 0, '—'] },
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* BRONZE MATCH — 3rd/4th place                                        */
/* ------------------------------------------------------------------ */
export const bronzeMatch: BracketMatch = {
  id: 'bronze',
  round: 'Disputa de Bronze',
  dates: '12/04',
  p1: { seed: 4, name: 'Luiz Guilherme',              s: [{ main: 6, tb: 2 }, 7, 4] },
  p2: { seed: 3, name: 'Mateus Palhares', w: true,    s: [{ main: 7, tb: 7 }, 5, 6] },
};

/* ------------------------------------------------------------------ */
/* GAMES — complete match history of the 1ª Edição                    */
/* ------------------------------------------------------------------ */
export const games: Game[] = [
  // 1ª Edição — Fase de Grupos
  { edition: 1, id: 'g-a1', phase: 'Fase de Grupos', round: '1ª Rodada — Grupo A', day: '03', month: 'MAR', date: '03/03', p1: 'Matias Pegasano',       p2: 'Marcus Ribeiro',       result: '6-3, 7⁷-6⁴'       },
  { edition: 1, id: 'g-b1', phase: 'Fase de Grupos', round: '1ª Rodada — Grupo B', day: '03', month: 'MAR', date: '03/03', p1: 'Guilherme Puccini',  p2: 'Silas Neto',        result: '6-1, 6-2'           },
  { edition: 1, id: 'g-d1', phase: 'Fase de Grupos', round: '1ª Rodada — Grupo D', day: '04', month: 'MAR', date: '04/03', p1: 'Mateus Palhares',        p2: 'Guilherme Meismith', result: '6-0, 6-1'           },
  { edition: 1, id: 'g-c1', phase: 'Fase de Grupos', round: '1ª Rodada — Grupo C', day: '04', month: 'MAR', date: '04/03', p1: 'Luiz Guilherme',         p2: 'Gabriel Holzmann',         result: '6-1, 6-0'           },
  { edition: 1, id: 'g-a2', phase: 'Fase de Grupos', round: '2ª Rodada — Grupo A', day: '10', month: 'MAR', date: '10/03', p1: 'Matias Pegasano',       p2: 'Leo Souza',      result: '6-1, 6-0'           },
  { edition: 1, id: 'g-b2', phase: 'Fase de Grupos', round: '2ª Rodada — Grupo B', day: '11', month: 'MAR', date: '11/03', p1: 'Guilherme Puccini',  p2: 'Arthur Donegá',       result: '6-1, 6-1'           },
  { edition: 1, id: 'g-c2', phase: 'Fase de Grupos', round: '2ª Rodada — Grupo C', day: '12', month: 'MAR', date: '12/03', p1: 'Lucas Chequer',      p2: 'Gabriel Holzmann',         result: '6-1, 6-2'           },
  { edition: 1, id: 'g-d2', phase: 'Fase de Grupos', round: '2ª Rodada — Grupo D', day: '12', month: 'MAR', date: '12/03', p1: 'Mateus Palhares',        p2: 'Caio Bessa',         result: '6-2, 6-1'           },
  { edition: 1, id: 'g-a3', phase: 'Fase de Grupos', round: '3ª Rodada — Grupo A', day: '18', month: 'MAR', date: '18/03', p1: 'Marcus Ribeiro',       p2: 'Leo Souza',      result: '6-4, 6-1'           },
  { edition: 1, id: 'g-b3', phase: 'Fase de Grupos', round: '3ª Rodada — Grupo B', day: '19', month: 'MAR', date: '19/03', p1: 'Silas Neto',        p2: 'Arthur Donegá',       result: 'WO — Silas Neto',        wo: true },
  { edition: 1, id: 'g-c3', phase: 'Fase de Grupos', round: '3ª Rodada — Grupo C', day: '19', month: 'MAR', date: '19/03', p1: 'Luiz Guilherme',         p2: 'Lucas Chequer',      result: 'WO — Luiz Guilherme',         wo: true },
  { edition: 1, id: 'g-d3', phase: 'Fase de Grupos', round: '3ª Rodada — Grupo D', day: '20', month: 'MAR', date: '20/03', p1: 'Guilherme Meismith', p2: 'Caio Bessa',         result: 'WO — Guilherme Meismith', wo: true },
  // 1ª Edição — Quartas de Final
  { edition: 1, id: 'qf1',  phase: 'Quartas de Final', round: 'Quarta de Final 1', day: '25', month: 'MAR', date: '25/03', p1: 'Matias Pegasano',      p2: 'Silas Neto',        result: '6-1, 6-3'      },
  { edition: 1, id: 'qf2',  phase: 'Quartas de Final', round: 'Quarta de Final 2', day: '25', month: 'MAR', date: '25/03', p1: 'Guilherme Puccini', p2: 'Marcus Ribeiro',       result: '6-4, 6-2'      },
  { edition: 1, id: 'qf3',  phase: 'Quartas de Final', round: 'Quarta de Final 3', day: '26', month: 'MAR', date: '26/03', p1: 'Luiz Guilherme',        p2: 'Guilherme Meismith', result: 'WO — Luiz Guilherme',    wo: true },
  { edition: 1, id: 'qf4',  phase: 'Quartas de Final', round: 'Quarta de Final 4', day: '26', month: 'MAR', date: '26/03', p1: 'Mateus Palhares',       p2: 'Lucas Chequer',      result: 'WO — Mateus Palhares',   wo: true },
  // 1ª Edição — Semifinais
  { edition: 1, id: 'sf1',  phase: 'Semifinais',       round: 'Semi-Final 1',      day: '01', month: 'ABR', date: '01/04', p1: 'Matias Pegasano',      p2: 'Luiz Guilherme',         result: '6-2, 6-0'      },
  { edition: 1, id: 'sf2',  phase: 'Semifinais',       round: 'Semi-Final 2',      day: '02', month: 'ABR', date: '02/04', p1: 'Guilherme Puccini', p2: 'Mateus Palhares',        result: '7-5, 5-7, 6-1' },
  { edition: 1, id: 'csf1', phase: 'Chave Consolação', round: 'Semi-Final 1 (Consolação)', day: '01', month: 'ABR', date: '01/04', p1: 'Silas Neto',  p2: 'Guilherme Meismith', result: 'WO — Silas Neto',   wo: true },
  { edition: 1, id: 'csf2', phase: 'Chave Consolação', round: 'Semi-Final 2 (Consolação)', day: '02', month: 'ABR', date: '02/04', p1: 'Marcus Ribeiro', p2: 'Lucas Chequer',     result: 'WO — Marcus Ribeiro',  wo: true },
  // 1ª Edição — Finais
  { edition: 1, id: 'final',  phase: 'Finais', round: 'Final',               day: '12', month: 'ABR', date: '12/04', p1: 'Matias Pegasano', p2: 'Guilherme Puccini', result: '6-4, 4-6, 6-2' },
  { edition: 1, id: 'cfinal', phase: 'Finais', round: 'Final da Consolação', day: '12', month: 'ABR', date: '12/04', p1: 'Marcus Ribeiro', p2: 'Silas Neto',       result: '6-3, 6-1'      },
  // 2ª Edição — Fase de Grupos — 1ª Rodada (27/04 - 03/05)
  { edition: 2, id: 'e2-b1', phase: 'Fase de Grupos', round: '1ª Rodada — Grupo B', day: '29', month: 'ABR', date: '29/04', p1: 'Mateus Palhares',   p2: 'Pedro Lara',       result: '6-1, 6-2'        },
  { edition: 2, id: 'e2-a2', phase: 'Fase de Grupos', round: '1ª Rodada — Grupo A', day: '29', month: 'ABR', date: '29/04', p1: 'Leo Souza',         p2: 'Silas Neto',       result: 'Ab. — Leo Souza', wo: true },
  { edition: 2, id: 'e2-d1', phase: 'Fase de Grupos', round: '1ª Rodada — Grupo D', day: '29', month: 'ABR', date: '29/04', p1: 'Guilherme Puccini', p2: 'Vitor Palhares',   result: '6-0, 6-4'        },
  { edition: 2, id: 'e2-c2', phase: 'Fase de Grupos', round: '1ª Rodada — Grupo C', day: '29', month: 'ABR', date: '29/04', p1: 'Lucas Chequer',     p2: 'Gabriel Holzmann', result: '6-0, 6-0'        },
  { edition: 2, id: 'e2-a1', phase: 'Fase de Grupos', round: '1ª Rodada — Grupo A', day: '30', month: 'ABR', date: '30/04', p1: 'Matias Pegasano',   p2: 'Luiz Fernando',    result: '6-0, 5-7, 6-4'   },
  { edition: 2, id: 'e2-c1', phase: 'Fase de Grupos', round: '1ª Rodada — Grupo C', day: '01', month: 'MAI', date: '01/05', p1: 'Diego Machado',     p2: 'Luiz Guilherme',   result: '6⁴-7⁷, 6-2, 6-2' },
  { edition: 2, id: 'e2-b2', phase: 'Fase de Grupos', round: '1ª Rodada — Grupo B', day: '04', month: 'MAI', date: '04/05', p1: 'Marcus Ribeiro',    p2: 'Caio Bessa',       result: '6-2, 6-0'        },
  { edition: 2, id: 'e2-d2', phase: 'Fase de Grupos', round: '1ª Rodada — Grupo D', day: '05', month: 'MAI', date: '05/05', p1: 'Guilherme Meismith', p2: 'Lucas Guarany',    result: '6-4, 6-2'        },
  // 2ª Edição — Fase de Grupos — 2ª Rodada (04/05 - 10/05)
  { edition: 2, id: 'e2-a3', phase: 'Fase de Grupos', round: '2ª Rodada — Grupo A', day: '10', month: 'MAI', date: '10/05', p1: 'Matias Pegasano',    p2: 'Leo Souza',          result: '6-2, 6-1'            },
  { edition: 2, id: 'e2-a4', phase: 'Fase de Grupos', round: '2ª Rodada — Grupo A', day: '10', month: 'MAI', date: '10/05', p1: 'Luiz Fernando',      p2: 'Silas Neto',         result: 'WO — Luiz Fernando', wo: true },
  { edition: 2, id: 'e2-b3', phase: 'Fase de Grupos', round: '2ª Rodada — Grupo B', day: '10', month: 'MAI', date: '10/05', p1: 'Mateus Palhares',    p2: 'Caio Bessa',         result: 'WO — Mateus Palhares', wo: true },
  { edition: 2, id: 'e2-b4', phase: 'Fase de Grupos', round: '2ª Rodada — Grupo B', day: '10', month: 'MAI', date: '10/05', p1: 'Marcus Ribeiro',     p2: 'Pedro Lara',         result: '6-1, 6-0'            },
  { edition: 2, id: 'e2-c3', phase: 'Fase de Grupos', round: '2ª Rodada — Grupo C', day: '10', month: 'MAI', date: '10/05', p1: 'Luiz Guilherme',     p2: 'Gabriel Holzmann',   result: '6-0, 6-0'            },
  { edition: 2, id: 'e2-c4', phase: 'Fase de Grupos', round: '2ª Rodada — Grupo C', day: '10', month: 'MAI', date: '10/05', p1: 'Diego Machado',      p2: 'Lucas Chequer',      result: '6-0, 6-2'            },
  { edition: 2, id: 'e2-d3', phase: 'Fase de Grupos', round: '2ª Rodada — Grupo D', day: '10', month: 'MAI', date: '10/05', p1: 'Guilherme Puccini',  p2: 'Lucas Guarany',      result: '6-0, 6-1'            },
  { edition: 2, id: 'e2-d4', phase: 'Fase de Grupos', round: '2ª Rodada — Grupo D', day: '10', month: 'MAI', date: '10/05', p1: 'Vitor Palhares',     p2: 'Guilherme Meismith', result: '6-1, 6-0'            },
  // 2ª Edição — Fase de Grupos — 3ª Rodada (11/05 - 17/05)
  { edition: 2, id: 'e2-a5', phase: 'Fase de Grupos', round: '3ª Rodada — Grupo A', day: '17', month: 'MAI', date: '17/05', p1: 'Matias Pegasano',    p2: 'Silas Neto',         result: '6-0, 6-1'            },
  { edition: 2, id: 'e2-a6', phase: 'Fase de Grupos', round: '3ª Rodada — Grupo A', day: '18', month: 'MAI', date: '18/05', p1: 'Luiz Fernando',      p2: 'Leo Souza',          result: '6-1, 6-0'            },
  { edition: 2, id: 'e2-c5', phase: 'Fase de Grupos', round: '3ª Rodada — Grupo C', day: '18', month: 'MAI', date: '18/05', p1: 'Lucas Chequer',      p2: 'Luiz Guilherme',     result: '4-6, 7⁷-6¹, 6-3'    },
  { edition: 2, id: 'e2-c6', phase: 'Fase de Grupos', round: '3ª Rodada — Grupo C', day: '18', month: 'MAI', date: '18/05', p1: 'Diego Machado',      p2: 'Gabriel Holzmann',   result: '6-0, 6-0'            },
  { edition: 2, id: 'e2-d5', phase: 'Fase de Grupos', round: '3ª Rodada — Grupo D', day: '18', month: 'MAI', date: '18/05', p1: 'Guilherme Puccini',  p2: 'Guilherme Meismith', result: '6-1, 6-0'            },
  { edition: 2, id: 'e2-d6', phase: 'Fase de Grupos', round: '3ª Rodada — Grupo D', day: '18', month: 'MAI', date: '18/05', p1: 'Vitor Palhares',     p2: 'Lucas Guarany',      result: '6-0, 6-3'            },
  { edition: 2, id: 'e2-b5', phase: 'Fase de Grupos', round: '3ª Rodada — Grupo B', day: '24', month: 'MAI', date: '24/05', p1: 'Mateus Palhares',     p2: 'Marcus Ribeiro',     result: '5-7, 4-6'            },
  // 2ª Edição — Quartas de Final
  { edition: 2, id: 'e2-qf1', phase: 'Quartas de Final', round: 'Quarta de Final 1', day: '24', month: 'MAI', date: '24/05', p1: 'Matias Pegasano',    p2: 'Mateus Palhares',  result: '6-1, 6-1' },
  { edition: 2, id: 'e2-qf3', phase: 'Quartas de Final', round: 'Quarta de Final 3', day: '24', month: 'MAI', date: '24/05', p1: 'Diego Machado',      p2: 'Vitor Palhares',   result: '6-3, 6-4' },
  { edition: 2, id: 'e2-qf4', phase: 'Quartas de Final', round: 'Quarta de Final 4', day: '24', month: 'MAI', date: '24/05', p1: 'Guilherme Puccini',  p2: 'Lucas Chequer',    result: '6-2, 6-1' },
  // 2ª Edição — Quartas de Final (Consolação)
  { edition: 2, id: 'e2-cqf2', phase: 'Quartas de Final', round: 'Quarta de Final 2', day: '24', month: 'MAI', date: '24/05', p1: 'Caio Bessa', p2: 'Silas Neto', result: '5-7, 4-6' },
  { edition: 2, id: 'e2-b6', phase: 'Fase de Grupos', round: '3ª Rodada — Grupo B', day: '18', month: 'MAI', date: '18/05', p1: 'Caio Bessa',         p2: 'Pedro Lara',         result: '6-2, 6-0'            },
];

/* ------------------------------------------------------------------ */
/* PLAYER EDITION HISTORY                                             */
/* ------------------------------------------------------------------ */
export type PlayerEditionStat = {
  editionId: number;
  finalPosition?: number;
  points?: number;
  wins?: number;
  losses?: number;
  groupPosition?: number;
};

export const playerEditionHistory: Record<string, PlayerEditionStat[]> = {
  'Matias Pegasano': [
    { editionId: 1, finalPosition: 1, points: 100, wins: 5, losses: 0, groupPosition: 1 },
    { editionId: 2, wins: 3, losses: 0, groupPosition: 1 },
  ],
};

/* ------------------------------------------------------------------ */
/* 2ª EDIÇÃO — GROUP MATCHES & STANDINGS                              */
/* ------------------------------------------------------------------ */

const noScore: ('—')[] = ['—', '—', '—'];

export const groupMatchesByEdition: Record<number, Record<string, GroupMatch[]>> = {
  1: groupMatches,
  2: {
    A: [
      { id: 'e2-a1', round: '1ª Rodada', dates: '27/04 - 03/05', scheduledAt: '30/04 · Qui · 19h', p1: { seed: 1,  name: 'Matias Pegasano'  }, p2: { seed: 13, name: 'Luiz Fernando'    }, scores1: [6, 5, 6], scores2: [0, 7, 4], winner: 1 },
      { id: 'e2-a2', round: '1ª Rodada', dates: '27/04 - 03/05', p1: { seed: 6,  name: 'Silas Neto'   }, p2: { seed: 9,  name: 'Leo Souza' }, scores1: [5, 2], scores2: [7, 3], winner: 2, wo: 1 },
      { id: 'e2-a3', round: '2ª Rodada', dates: '04/05 - 10/05', scheduledAt: '10/05 · Dom · 16h', location: 'Residencial 11', p1: { seed: 1,  name: 'Matias Pegasano'  }, p2: { seed: 9,  name: 'Leo Souza' }, scores1: [6, 6], scores2: [2, 1], winner: 1 },
      { id: 'e2-a4', round: '2ª Rodada', dates: '04/05 - 10/05', p1: { seed: 6,  name: 'Silas Neto'   }, p2: { seed: 13, name: 'Luiz Fernando'    }, scores1: [0, 0], scores2: [6, 6], winner: 2, wo: 1 },
      { id: 'e2-a5', round: '3ª Rodada', dates: '11/05 - 17/05', scheduledAt: '17/05 · Sáb · 15h', location: 'Residencial 11', p1: { seed: 1,  name: 'Matias Pegasano'  }, p2: { seed: 6,  name: 'Silas Neto'   }, scores1: [6, 6], scores2: [0, 1], winner: 1 },
      { id: 'e2-a6', round: '3ª Rodada', dates: '11/05 - 17/05', p1: { seed: 9,  name: 'Leo Souza' }, p2: { seed: 13, name: 'Luiz Fernando'    }, scores1: [1, 0], scores2: [6, 6], winner: 2 },
    ],
    B: [
      { id: 'e2-b1', round: '1ª Rodada', dates: '27/04 - 03/05', p1: { seed: 3,  name: 'Mateus Palhares'  }, p2: { seed: 15, name: 'Pedro Lara'   }, scores1: [6, 6], scores2: [1, 2], winner: 1 },
      { id: 'e2-b2', round: '1ª Rodada', dates: '27/04 - 03/05', p1: { seed: 5,  name: 'Marcus Ribeiro' }, p2: { seed: 11, name: 'Caio Bessa'   }, scores1: [6, 6], scores2: [2, 0], winner: 1 },
      { id: 'e2-b3', round: '2ª Rodada', dates: '04/05 - 10/05', p1: { seed: 3,  name: 'Mateus Palhares'  }, p2: { seed: 11, name: 'Caio Bessa'   }, scores1: [6, 6], scores2: [0, 0], winner: 1, wo: 2 },
      { id: 'e2-b4', round: '2ª Rodada', dates: '04/05 - 10/05', p1: { seed: 5,  name: 'Marcus Ribeiro' }, p2: { seed: 15, name: 'Pedro Lara'   }, scores1: [6, 6], scores2: [1, 0], winner: 1 },
      { id: 'e2-b5', round: '3ª Rodada', dates: '11/05 - 17/05', p1: { seed: 3,  name: 'Mateus Palhares'  }, p2: { seed: 5,  name: 'Marcus Ribeiro' }, scores1: [5, 4], scores2: [7, 6], winner: 2 },
      { id: 'e2-b6', round: '3ª Rodada', dates: '11/05 - 17/05', p1: { seed: 11, name: 'Caio Bessa'   }, p2: { seed: 15, name: 'Pedro Lara'   }, scores1: [6, 6], scores2: [2, 0], winner: 1 },
    ],
    C: [
      { id: 'e2-c1', round: '1ª Rodada', dates: '27/04 - 03/05', p1: { seed: 4,  name: 'Luiz Guilherme'    }, p2: { seed: 14, name: 'Diego Machado'   }, scores1: [{ main: 7, tb: 7 }, 2, 2], scores2: [{ main: 6, tb: 4 }, 6, 6], winner: 2 },
      { id: 'e2-c2', round: '1ª Rodada', dates: '27/04 - 03/05', p1: { seed: 8,  name: 'Lucas Chequer' }, p2: { seed: 12, name: 'Gabriel Holzmann'    }, scores1: [6, 6], scores2: [0, 0], winner: 1 },
      { id: 'e2-c3', round: '2ª Rodada', dates: '04/05 - 10/05', p1: { seed: 4,  name: 'Luiz Guilherme'    }, p2: { seed: 12, name: 'Gabriel Holzmann'    }, scores1: [6, 6], scores2: [0, 0], winner: 1 },
      { id: 'e2-c4', round: '2ª Rodada', dates: '04/05 - 10/05', p1: { seed: 8,  name: 'Lucas Chequer' }, p2: { seed: 14, name: 'Diego Machado'   }, scores1: [0, 2], scores2: [6, 6], winner: 2 },
      { id: 'e2-c5', round: '3ª Rodada', dates: '11/05 - 17/05', p1: { seed: 4,  name: 'Luiz Guilherme'    }, p2: { seed: 8,  name: 'Lucas Chequer' }, scores1: [6, { main: 6, tb: 1 }, 3], scores2: [4, { main: 7, tb: 7 }, 6], winner: 2 },
      { id: 'e2-c6', round: '3ª Rodada', dates: '11/05 - 17/05', p1: { seed: 12, name: 'Gabriel Holzmann'    }, p2: { seed: 14, name: 'Diego Machado'   }, scores1: [0, 0], scores2: [6, 6], winner: 2 },
    ],
    D: [
      { id: 'e2-d1', round: '1ª Rodada', dates: '27/04 - 03/05', p1: { seed: 2,  name: 'Guilherme Puccini'  }, p2: { seed: 16, name: 'Vitor Palhares'        }, scores1: [6, 6], scores2: [0, 4], winner: 1 },
      { id: 'e2-d2', round: '1ª Rodada', dates: '27/04 - 03/05', p1: { seed: 7,  name: 'Guilherme Meismith' }, p2: { seed: 10, name: 'Lucas Guarany'        }, scores1: [6, 6], scores2: [4, 2], winner: 1 },
      { id: 'e2-d3', round: '2ª Rodada', dates: '04/05 - 10/05', p1: { seed: 2,  name: 'Guilherme Puccini'  }, p2: { seed: 10, name: 'Lucas Guarany'        }, scores1: [6, 6], scores2: [0, 1], winner: 1 },
      { id: 'e2-d4', round: '2ª Rodada', dates: '04/05 - 10/05', p1: { seed: 7,  name: 'Guilherme Meismith' }, p2: { seed: 16, name: 'Vitor Palhares'        }, scores1: [1, 0], scores2: [6, 6], winner: 2 },
      { id: 'e2-d5', round: '3ª Rodada', dates: '11/05 - 17/05', p1: { seed: 2,  name: 'Guilherme Puccini'  }, p2: { seed: 7,  name: 'Guilherme Meismith' }, scores1: [6, 6], scores2: [1, 0], winner: 1 },
      { id: 'e2-d6', round: '3ª Rodada', dates: '11/05 - 17/05', p1: { seed: 10, name: 'Lucas Guarany'        }, p2: { seed: 16, name: 'Vitor Palhares'        }, scores1: [0, 3], scores2: [6, 6], winner: 2 },
    ],
  },
};

export const groupStandingsByEdition: Record<number, Record<string, {
  pos: string; seed: number; name: string; games: number; sets: number; pts: number;
}[]>> = {
  1: groupStandings,
  2: {
    A: [
      { pos: '1º', seed: 1,  name: 'Matias Pegasano',  games: 26,  sets: 5,  pts: 9 },
      { pos: '2º', seed: 13, name: 'Luiz Fernando',    games: 17,  sets: 3,  pts: 6 },
      { pos: '3º', seed: 9,  name: 'Leo Souza',        games: -17, sets: -3, pts: 3 },
      { pos: '4º', seed: 6,  name: 'Silas Neto',       games: -26, sets: -5, pts: 0 },
    ],
    B: [
      { pos: '1º', seed: 5,  name: 'Marcus Ribeiro',   games: 25,  sets: 6,  pts: 9 },
      { pos: '2º', seed: 3,  name: 'Mateus Palhares',  games: 17,  sets: 2,  pts: 6 },
      { pos: '3º', seed: 11, name: 'Caio Bessa',       games: -12, sets: -2, pts: 3 },
      { pos: '4º', seed: 15, name: 'Pedro Lara',       games: -30, sets: -6, pts: 0 },
    ],
    C: [
      { pos: '1º', seed: 14, name: 'Diego Machado',    games: 29,  sets: 5,  pts: 9 },
      { pos: '2º', seed: 8,  name: 'Lucas Chequer',    games: 4,   sets: 1,  pts: 6 },
      { pos: '3º', seed: 4,  name: 'Luiz Guilherme',   games: 3,   sets: 0,  pts: 3 },
      { pos: '4º', seed: 12, name: 'Gabriel Holzmann', games: -36, sets: -6, pts: 0 },
    ],
    D: [
      { pos: '1º', seed: 2,  name: 'Guilherme Puccini',  games: 30,  sets: 6,  pts: 9 },
      { pos: '2º', seed: 16, name: 'Vitor Palhares',     games: 12,  sets: 2,  pts: 6 },
      { pos: '3º', seed: 7,  name: 'Guilherme Meismith', games: -16, sets: -2, pts: 3 },
      { pos: '4º', seed: 10, name: 'Lucas Guarany',      games: -26, sets: -6, pts: 0 },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* 2ª EDIÇÃO — CHAVE PRINCIPAL                                        */
/* Cruzamento: 1ºA×2ºB, 1ºB×2ºA, 1ºC×2ºD, 1ºD×2ºC                 */
/* ------------------------------------------------------------------ */
const ns: ('—')[] = ['—', '—', '—'];

export const mainBracketE2: { col: number; matches: BracketMatch[] }[] = [
  {
    col: 0,
    matches: [
      {
        id: 'e2-qf1', round: 'Quarta de Final 1', dates: '19/05 - 25/05',
        p1: { seed: 1,  name: 'Matias Pegasano', w: true, s: [6, 6, '—'] },
        p2: { seed: 3,  name: 'Mateus Palhares',          s: [1, 1, '—'] },
      },
      {
        id: 'e2-qf3', round: 'Quarta de Final 3', dates: '19/05 - 25/05',
        p1: { seed: 14, name: 'Diego Machado',  w: true, s: [6, 6, '—'] },
        p2: { seed: 16, name: 'Vitor Palhares',           s: [3, 4, '—'] },
      },
    ],
  },
  {
    col: 1,
    matches: [
      {
        id: 'e2-sf1', round: 'Semi-Final 1', dates: '26/05 - 01/06',
        p1: { seed: 1,  name: 'Matias Pegasano', s: ns },
        p2: { seed: 14, name: 'Diego Machado',   s: ns },
      },
    ],
  },
  {
    col: 2,
    matches: [
      {
        id: 'e2-final', round: 'Final', dates: '06/06',
        p1: { seed: 0, name: 'A definir', s: ns },
        p2: { seed: 0, name: 'A definir', s: ns },
      },
    ],
  },
  {
    col: 3,
    matches: [
      {
        id: 'e2-sf2', round: 'Semi-Final 2', dates: '26/05 - 01/06',
        p1: { seed: 0, name: 'A definir',           s: ns },
        p2: { seed: 2, name: 'Guilherme Puccini',   s: ns },
      },
    ],
  },
  {
    col: 4,
    matches: [
      {
        id: 'e2-qf2', round: 'Quarta de Final 2', dates: '19/05 - 25/05',
        p1: { seed: 5,  name: 'Marcus Ribeiro', s: ns },
        p2: { seed: 13, name: 'Luiz Fernando',  s: ns },
      },
      {
        id: 'e2-qf4', round: 'Quarta de Final 4', dates: '19/05 - 25/05',
        p1: { seed: 2, name: 'Guilherme Puccini', w: true, s: [6, 6, '—'] },
        p2: { seed: 8, name: 'Lucas Chequer',              s: [2, 1, '—'] },
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* 2ª EDIÇÃO — CHAVE CONSOLAÇÃO                                       */
/* Cruzamento: 3ºA×4ºB, 3ºB×4ºA, 3ºC×4ºD, 3ºD×4ºC                 */
/* ------------------------------------------------------------------ */
export const consolationBracketE2: { col: number; ghost?: boolean; matches: BracketMatch[] }[] = [
  {
    col: 0,
    matches: [
      {
        id: 'e2-cqf1', round: 'Quarta de Final 1', dates: '19/05 - 25/05',
        p1: { seed: 9,  name: 'Leo Souza',  s: ns },
        p2: { seed: 15, name: 'Pedro Lara', s: ns },
      },
      {
        id: 'e2-cqf3', round: 'Quarta de Final 3', dates: '19/05 - 25/05',
        p1: { seed: 4,  name: 'Luiz Guilherme', s: ns },
        p2: { seed: 10, name: 'Lucas Guarany',  s: ns },
      },
    ],
  },
  {
    col: 1,
    matches: [
      {
        id: 'e2-csf1', round: 'Semi-Final 1', dates: '26/05 - 01/06',
        p1: { seed: 0, name: 'A definir', s: ns },
        p2: { seed: 0, name: 'A definir', s: ns },
      },
    ],
  },
  {
    col: 2,
    matches: [
      {
        id: 'e2-cfinal', round: 'Final', dates: '06/06',
        p1: { seed: 0, name: 'A definir', s: ns },
        p2: { seed: 0, name: 'A definir', s: ns },
      },
    ],
  },
  {
    col: 3,
    matches: [
      {
        id: 'e2-csf2', round: 'Semi-Final 2', dates: '26/05 - 01/06',
        p1: { seed: 6, name: 'Silas Neto', s: ns },
        p2: { seed: 0, name: 'A definir',  s: ns },
      },
    ],
  },
  {
    col: 4,
    matches: [
      {
        id: 'e2-cqf2', round: 'Quarta de Final 2', dates: '19/05 - 25/05',
        p1: { seed: 11, name: 'Caio Bessa',          s: [5, 4, '—'] },
        p2: { seed: 6,  name: 'Silas Neto',  w: true, s: [7, 6, '—'] },
      },
      {
        id: 'e2-cqf4', round: 'Quarta de Final 4', dates: '19/05 - 25/05',
        p1: { seed: 7,  name: 'Guilherme Meismith',  s: ns },
        p2: { seed: 12, name: 'Gabriel Holzmann',    s: ns },
      },
    ],
  },
];

export const bronzeE2: BracketMatch = {
  id: 'e2-bronze',
  round: 'Disputa de 3º Lugar',
  dates: '06/06',
  p1: { seed: 0, name: 'A definir', s: ns },
  p2: { seed: 0, name: 'A definir', s: ns },
};

export const consolationBronzeE2: BracketMatch = {
  id: 'e2-cbronze',
  round: 'Disputa de 7º Lugar',
  dates: '06/06',
  p1: { seed: 0, name: 'A definir', s: ns },
  p2: { seed: 0, name: 'A definir', s: ns },
};
