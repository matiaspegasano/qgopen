'use client';

import type { Edition } from '@/lib/data';

interface Props {
  editions: Edition[];
  selected: Set<number>;
  onToggle: (id: number) => void;
}

export default function EditionFilter({ editions, selected, onToggle }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--qg-fg-3)',
      }}>
        Edição
      </span>
      {editions.map(ed => {
        const active = selected.has(ed.id);
        return (
          <button
            key={ed.id}
            onClick={() => onToggle(ed.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--qg-font-display)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12,
              padding: '5px 12px', borderRadius: 'var(--qg-radius-sm)',
              border: `1px solid ${active ? 'var(--qg-green)' : 'var(--qg-line-strong)'}`,
              background: active ? 'var(--qg-green-wash)' : 'var(--qg-bg-elev)',
              color: active ? 'var(--qg-green)' : 'var(--qg-fg-2)',
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 140ms',
            }}
          >
            {active && <span style={{ fontSize: 11 }}>✓</span>}
            {ed.label}
            {ed.status === 'upcoming' && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                background: 'var(--qg-clay-wash)', color: 'var(--qg-clay-deep)',
                padding: '2px 5px', borderRadius: 'var(--qg-radius-sm)',
                textTransform: 'uppercase',
              }}>
                Em breve
              </span>
            )}
            {ed.status === 'completed' && (
              <span style={{ fontWeight: 400, color: 'var(--qg-fg-3)', fontSize: 11 }}>
                · {ed.year}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
