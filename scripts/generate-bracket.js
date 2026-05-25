// node scripts/generate-bracket.js
// Gera public/bracket.svg (1920x1080) com chave principal e consolação
const fs   = require('fs');
const path = require('path');

const W = 1920, H = 1080;
const CW = 232, CH = 58, RH = 29;

const C = {
  bg:    '#060e09',
  card:  '#0b2014',
  bdr:   '#1c4427',
  hl:    '#122d1b',
  t1:    '#e8f0ea',
  t2:    '#9fb8a7',
  t3:    '#4d7460',
  seedb: '#1c4427',
  seedt: '#9fd3b2',
  line:  '#1d4828',
  clay:  '#e55b3c',
  label: '#5d8a6d',
  title: '#b8d4c0',
  sep:   '#162e1e',
};

// Colunas (left edge)
const X = { lqf: 200, lsf: 522, fin: 844, rsf: 1168, rqf: 1490 };
// X.lqf + CW = 432; X.lsf + CW = 754; X.fin + CW = 1076; X.rsf + CW = 1400

// Main bracket Y (cartas)
const M = { q1: 150, q2: 354, sf: 252 };
// M.q1 mid=179, M.q2 mid=383, SF mid=(179+383)/2=281 => sf=252, sfMid=281

// Consolation bracket Y
const Co = { q1: 620, q2: 824, sf: 722 };
// Co.q1 mid=649, Co.q2 mid=853, SF mid=751 => sf=722, sfMid=751

function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function seedBadge(cx, cy, seed) {
  if (!seed || seed <= 0) return '';
  const bx = cx + 6, by = cy + (RH-16)/2;
  return [
    `<rect x="${bx}" y="${by}" width="19" height="16" rx="3" fill="${C.seedb}"/>`,
    `<text x="${bx+9.5}" y="${by+8}" text-anchor="middle" dominant-baseline="middle"`,
    `  font-size="8.5" font-weight="700" fill="${C.seedt}" font-family="sans-serif">${seed}</text>`,
  ].join(' ');
}

function playerRow(cx, cy, p) {
  const midY = cy + RH / 2;
  const hasSeed = p.seed && p.seed > 0;
  const nx = hasSeed ? cx + 31 : cx + 9;
  const fill = (hasSeed || p.tbd) ? C.t1 : C.t3;
  const n = esc(p.name || 'A definir');
  const len = (p.name || '').length;
  const fs = len > 18 ? 9 : len > 15 ? 10 : 11;
  const fw = p.win ? '700' : '500';
  const lines = [seedBadge(cx, cy, p.seed)];
  lines.push(`<text x="${nx}" y="${midY}" dominant-baseline="middle" font-size="${fs}" font-weight="${fw}" fill="${fill}" font-family="sans-serif">${n}</text>`);
  if (p.score) {
    lines.push(`<text x="${cx+CW-7}" y="${midY}" text-anchor="end" dominant-baseline="middle" font-size="10" font-weight="${fw}" fill="${p.win ? C.t1 : C.t2}" font-family="sans-serif">${esc(p.score)}</text>`);
  }
  return lines.join('\n');
}

function card(x, y, p1, p2) {
  const lines = [];
  lines.push(`<rect x="${x}" y="${y}" width="${CW}" height="${CH}" rx="4" fill="${C.card}" stroke="${C.bdr}" stroke-width="1"/>`);
  if (p1.win) lines.push(`<rect x="${x+1}" y="${y+1}" width="${CW-2}" height="${RH-1}" rx="3" fill="${C.hl}"/>`);
  lines.push(playerRow(x, y, p1));
  lines.push(`<line x1="${x}" y1="${y+RH}" x2="${x+CW}" y2="${y+RH}" stroke="${C.bdr}" stroke-width="0.7"/>`);
  if (p2.win) lines.push(`<rect x="${x+1}" y="${y+RH+1}" width="${CW-2}" height="${RH-1}" rx="3" fill="${C.hl}"/>`);
  lines.push(playerRow(x, y+RH, p2));
  return lines.join('\n');
}

function connL(q1y, q2y, sfy) {
  const q1m = q1y+RH, q2m = q2y+RH, sm = sfy+RH;
  const mx  = X.lqf + CW + (X.lsf - X.lqf - CW) / 2;
  const s   = C.line;
  return [
    `<line x1="${X.lqf+CW}" y1="${q1m}" x2="${mx}" y2="${q1m}" stroke="${s}" stroke-width="1.3"/>`,
    `<line x1="${X.lqf+CW}" y1="${q2m}" x2="${mx}" y2="${q2m}" stroke="${s}" stroke-width="1.3"/>`,
    `<line x1="${mx}" y1="${q1m}" x2="${mx}" y2="${q2m}" stroke="${s}" stroke-width="1.3"/>`,
    `<line x1="${mx}" y1="${sm}"  x2="${X.lsf}"  y2="${sm}"  stroke="${s}" stroke-width="1.3"/>`,
  ].join('\n');
}

function connR(q1y, q2y, sfy) {
  const q1m = q1y+RH, q2m = q2y+RH, sm = sfy+RH;
  const mx  = X.rsf + CW + (X.rqf - X.rsf - CW) / 2;
  const s   = C.line;
  return [
    `<line x1="${X.rsf+CW}" y1="${sm}"  x2="${mx}" y2="${sm}"  stroke="${s}" stroke-width="1.3"/>`,
    `<line x1="${mx}" y1="${q1m}" x2="${mx}" y2="${q2m}" stroke="${s}" stroke-width="1.3"/>`,
    `<line x1="${mx}" y1="${q1m}" x2="${X.rqf}" y2="${q1m}" stroke="${s}" stroke-width="1.3"/>`,
    `<line x1="${mx}" y1="${q2m}" x2="${X.rqf}" y2="${q2m}" stroke="${s}" stroke-width="1.3"/>`,
  ].join('\n');
}

function connMid(sfy) {
  const sm = sfy + RH;
  return [
    `<line x1="${X.lsf+CW}" y1="${sm}" x2="${X.fin}"     y2="${sm}" stroke="${C.line}" stroke-width="1.3"/>`,
    `<line x1="${X.fin+CW}"  y1="${sm}" x2="${X.rsf}" y2="${sm}" stroke="${C.line}" stroke-width="1.3"/>`,
  ].join('\n');
}

function rlabel(x, y, txt, col) {
  col = col || C.label;
  return `<text x="${x+CW/2}" y="${y}" text-anchor="middle" font-size="8.5" font-weight="600" letter-spacing="0.08em" fill="${col}" font-family="sans-serif">${esc(txt)}</text>`;
}

// ── Match data ──────────────────────────────────────────────────────────────
const MAIN = {
  lqf1: [{ seed: 1,  name: 'Matias Pegasano' },  { seed: 0, name: '1° Grupo B', tbd: true }],
  lqf3: [{ seed: 14, name: 'Diego Machado' },     { seed: 16, name: 'Vitor Palhares' }],
  lsf:  [{ name: 'A definir' },                   { name: 'A definir' }],
  fin:  [{ name: 'A definir' },                   { name: 'A definir' }],
  rsf:  [{ name: 'A definir' },                   { name: 'A definir' }],
  rqf2: [{ seed: 0, name: '2° Grupo B', tbd:true },{ seed: 13, name: 'Luiz Fernando' }],
  rqf4: [{ seed: 2,  name: 'Guilherme Puccini' }, { seed: 8,  name: 'Lucas Chequer' }],
};

const CONS = {
  lqf1: [{ seed: 9,  name: 'Leo Souza' },         { seed: 15, name: 'Pedro Lara' }],
  lqf3: [{ seed: 4,  name: 'Luiz Guilherme' },    { seed: 10, name: 'Lucas Guarany' }],
  lsf:  [{ name: 'A definir' },                   { name: 'A definir' }],
  fin:  [{ name: 'A definir' },                   { name: 'A definir' }],
  rsf:  [{ name: 'A definir' },                   { name: 'A definir' }],
  rqf2: [{ seed: 11, name: 'Caio Bessa' },        { seed: 6,  name: 'Silas Neto' }],
  rqf4: [{ seed: 7,  name: 'Guilherme Meismith' },{ seed: 12, name: 'Gabriel Holzmann' }],
};

// ── Build SVG ────────────────────────────────────────────────────────────────
const sep = 497; // horizontal separator between sections
const svgParts = [
`<?xml version="1.0" encoding="UTF-8"?>
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
<defs>
  <style>* { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }</style>
</defs>

<!-- Background -->
<rect width="1920" height="1080" fill="${C.bg}"/>

<!-- Top header -->
<text x="960" y="36" text-anchor="middle" font-size="15" font-weight="700"
  letter-spacing="0.18em" fill="${C.title}">QG OPEN · 2ª EDIÇÃO</text>
<text x="960" y="58" text-anchor="middle" font-size="10" fill="${C.label}"
  letter-spacing="0.10em">FASE ELIMINATÓRIA · MAI–JUN 2026</text>
<line x1="200" y1="70" x2="1722" y2="70" stroke="${C.sep}" stroke-width="1"/>

<!-- ════════════════════════════════════════════════ -->
<!--  CHAVE PRINCIPAL                                -->
<!-- ════════════════════════════════════════════════ -->
<text x="200" y="93" font-size="9" font-weight="700" letter-spacing="0.14em"
  fill="${C.label}">CHAVE PRINCIPAL</text>

${rlabel(X.lqf, M.q1-13, 'QF 1 · 19–25 Mai')}
${rlabel(X.lqf, M.q2-13, 'QF 3 · 19–25 Mai')}
${rlabel(X.lsf, M.sf-13, 'Semi-Final · 26 Mai–1 Jun')}
${rlabel(X.fin, M.sf-13, 'FINAL · 6 Jun', C.clay)}
${rlabel(X.rsf, M.sf-13, 'Semi-Final · 26 Mai–1 Jun')}
${rlabel(X.rqf, M.q1-13, 'QF 2 · 19–25 Mai')}
${rlabel(X.rqf, M.q2-13, 'QF 4 · 19–25 Mai')}

${connL(M.q1, M.q2, M.sf)}
${connMid(M.sf)}
${connR(M.q1, M.q2, M.sf)}

${card(X.lqf, M.q1,  MAIN.lqf1[0], MAIN.lqf1[1])}
${card(X.lqf, M.q2,  MAIN.lqf3[0], MAIN.lqf3[1])}
${card(X.lsf, M.sf,  MAIN.lsf[0],  MAIN.lsf[1])}
${card(X.fin, M.sf,  MAIN.fin[0],  MAIN.fin[1])}
${card(X.rsf, M.sf,  MAIN.rsf[0],  MAIN.rsf[1])}
${card(X.rqf, M.q1,  MAIN.rqf2[0], MAIN.rqf2[1])}
${card(X.rqf, M.q2,  MAIN.rqf4[0], MAIN.rqf4[1])}

<!-- Bronze connectors: bottom of each SF → bronze top -->
<line x1="${X.lsf+CW/2}" y1="${M.sf+CH}" x2="${X.lsf+CW/2}" y2="${(M.sf+CH+M.q2)/2}" stroke="${C.line}" stroke-width="1" stroke-dasharray="3 3"/>
<line x1="${X.lsf+CW/2}" y1="${(M.sf+CH+M.q2)/2}" x2="${X.fin+CW/2}" y2="${(M.sf+CH+M.q2)/2}" stroke="${C.line}" stroke-width="1" stroke-dasharray="3 3"/>
<line x1="${X.rsf+CW/2}" y1="${M.sf+CH}" x2="${X.rsf+CW/2}" y2="${(M.sf+CH+M.q2)/2}" stroke="${C.line}" stroke-width="1" stroke-dasharray="3 3"/>
<line x1="${X.rsf+CW/2}" y1="${(M.sf+CH+M.q2)/2}" x2="${X.fin+CW/2}" y2="${(M.sf+CH+M.q2)/2}" stroke="${C.line}" stroke-width="1" stroke-dasharray="3 3"/>
<line x1="${X.fin+CW/2}" y1="${(M.sf+CH+M.q2)/2}" x2="${X.fin+CW/2}" y2="${M.q2}" stroke="${C.line}" stroke-width="1" stroke-dasharray="3 3"/>

<!-- Bronze final -->
${rlabel(X.fin, M.q2-13, '3º LUGAR · 6 Jun', C.clay)}
${card(X.fin, M.q2,  [{ name: 'A definir' }][0],  [{ name: 'A definir' }][0])}

<!-- Separator -->
<line x1="200" y1="${sep}" x2="1722" y2="${sep}" stroke="${C.sep}" stroke-width="1"/>

<!-- ════════════════════════════════════════════════ -->
<!--  CHAVE CONSOLAÇÃO                               -->
<!-- ════════════════════════════════════════════════ -->
<text x="200" y="${sep+22}" font-size="9" font-weight="700" letter-spacing="0.14em"
  fill="${C.label}">CHAVE CONSOLAÇÃO</text>

${rlabel(X.lqf, Co.q1-13, 'QF 1 · 19–25 Mai')}
${rlabel(X.lqf, Co.q2-13, 'QF 3 · 19–25 Mai')}
${rlabel(X.lsf, Co.sf-13, 'Semi-Final · 26 Mai–1 Jun')}
${rlabel(X.fin, Co.sf-13, 'FINAL · 6 Jun', C.clay)}
${rlabel(X.rsf, Co.sf-13, 'Semi-Final · 26 Mai–1 Jun')}
${rlabel(X.rqf, Co.q1-13, 'QF 2 · 19–25 Mai')}
${rlabel(X.rqf, Co.q2-13, 'QF 4 · 19–25 Mai')}

${connL(Co.q1, Co.q2, Co.sf)}
${connMid(Co.sf)}
${connR(Co.q1, Co.q2, Co.sf)}

${card(X.lqf, Co.q1,  CONS.lqf1[0], CONS.lqf1[1])}
${card(X.lqf, Co.q2,  CONS.lqf3[0], CONS.lqf3[1])}
${card(X.lsf, Co.sf,  CONS.lsf[0],  CONS.lsf[1])}
${card(X.fin, Co.sf,  CONS.fin[0],  CONS.fin[1])}
${card(X.rsf, Co.sf,  CONS.rsf[0],  CONS.rsf[1])}
${card(X.rqf, Co.q1,  CONS.rqf2[0], CONS.rqf2[1])}
${card(X.rqf, Co.q2,  CONS.rqf4[0], CONS.rqf4[1])}

<!-- Footer -->
<text x="960" y="1062" text-anchor="middle" font-size="9" fill="${C.t3}"
  letter-spacing="0.05em">qgopen.com.br · Fase Eliminatória · 2ª Edição · 2026</text>

</svg>`,
];

const out = path.join(__dirname, '..', 'public', 'bracket.svg');
fs.writeFileSync(out, svgParts.join(''), 'utf8');
console.log('✓  bracket.svg gerado em', out);
console.log('   Acesse em: http://localhost:3000/bracket.svg');
