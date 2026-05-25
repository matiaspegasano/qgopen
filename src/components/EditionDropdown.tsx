'use client';

import { useState, useRef, useEffect } from 'react';
import type { Edition } from '@/lib/data';

interface Props {
  editions: Edition[];
  selected: number;
  onChange: (id: number) => void;
}

export default function EditionDropdown({ editions, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = editions.find(e => e.id === selected)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', alignSelf: 'center', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          fontFamily: 'var(--qg-font-display)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12,
          color: 'var(--qg-fg-1)', background: 'none',
          border: '1px solid var(--qg-line-strong)',
          borderRadius: 'var(--qg-radius-sm)', padding: '6px 12px',
          cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'border-color 140ms, color 140ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--qg-fg-3)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--qg-line-strong)')}
      >
        {current.label} · {current.year}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ marginLeft: 2, transition: 'transform 140ms', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M1 1l4 4 4-4" stroke="var(--qg-fg-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 100,
          background: 'var(--qg-bg-elev)', border: '1px solid var(--qg-line)',
          borderRadius: 'var(--qg-radius-md)', boxShadow: 'var(--qg-shadow-2)',
          minWidth: 220, overflow: 'hidden',
        }}>
          {editions.map((ed, i) => (
            <button
              key={ed.id}
              onClick={() => { onChange(ed.id); setOpen(false); }}
              style={{
                display: 'flex', flexDirection: 'column', gap: 3,
                width: '100%', padding: '12px 16px',
                border: 'none', borderTop: i > 0 ? '1px solid var(--qg-line)' : 'none',
                cursor: 'pointer', textAlign: 'left',
                background: ed.id === selected ? 'var(--qg-green-wash)' : 'var(--qg-bg-elev)',
                transition: 'background 140ms',
              }}
              onMouseEnter={e => { if (ed.id !== selected) e.currentTarget.style.background = 'var(--qg-bg-sub)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ed.id === selected ? 'var(--qg-green-wash)' : 'var(--qg-bg-elev)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{
                  fontFamily: 'var(--qg-font-display)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 13,
                  color: ed.id === selected ? 'var(--qg-green)' : 'var(--qg-fg-1)',
                }}>
                  {ed.label} · {ed.year}
                </span>
                {ed.id === selected && (
                  <span style={{ color: 'var(--qg-green)', fontWeight: 700, fontSize: 13 }}>✓</span>
                )}
              </div>
              <span style={{ fontSize: 11, color: 'var(--qg-fg-3)' }}>
                {ed.status === 'completed' && `Encerrado · ${ed.startDate} – ${ed.endDate}`}
                {ed.status === 'upcoming'  && `Em breve · ${ed.startDate}`}
                {ed.status === 'active'    && `Em andamento · desde ${ed.startDate}`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
