'use client';

import { useState, useRef, useEffect } from 'react';
import type { Edition } from '@/lib/data';

function Checkbox({ checked, indeterminate }: { checked: boolean; indeterminate?: boolean }) {
  const bg   = checked || indeterminate ? 'var(--qg-green)' : 'transparent';
  const border = checked || indeterminate ? 'none' : '1.5px solid var(--qg-line-strong)';
  return (
    <span style={{
      width: 16, height: 16, borderRadius: 2, flexShrink: 0,
      border, background: bg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 140ms',
    }}>
      {indeterminate && !checked && (
        <svg width="8" height="2" viewBox="0 0 8 2" fill="none">
          <path d="M1 1h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function statusText(ed: Edition): string {
  if (ed.status === 'completed') return `Encerrado · ${ed.startDate} – ${ed.endDate}`;
  if (ed.status === 'upcoming')  return `Em breve · ${ed.startDate}`;
  return `Em andamento · desde ${ed.startDate}`;
}

interface Props {
  editions: Edition[];
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
}

export default function EditionMultiDropdown({ editions, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const allIds       = editions.map(e => e.id);
  const isAllSelected = allIds.every(id => selected.has(id));
  const isIndeterminate = selected.size > 0 && !isAllSelected;

  const buttonLabel = isAllSelected
    ? 'Todas as edições'
    : selected.size === 1
    ? (() => { const ed = editions.find(e => e.id === [...selected][0]); return ed ? `${ed.label} · ${ed.year}` : ''; })()
    : `${selected.size} edições selecionadas`;

  function toggleAll() {
    onChange(isAllSelected ? new Set([allIds[0]]) : new Set(allIds));
  }

  function toggleOne(id: number) {
    const next = new Set(selected);
    if (next.has(id)) {
      if (next.size > 1) next.delete(id);
    } else {
      next.add(id);
    }
    onChange(next);
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const rowStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '10px 16px',
    border: 'none', cursor: 'pointer', textAlign: 'left',
    background: active ? 'var(--qg-green-wash)' : 'var(--qg-bg-elev)',
    transition: 'background 120ms',
  });

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
          transition: 'border-color 140ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--qg-fg-3)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--qg-line-strong)')}
      >
        {buttonLabel}
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ marginLeft: 2, transition: 'transform 140ms', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <path d="M1 1l4 4 4-4" stroke="var(--qg-fg-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 100,
          background: 'var(--qg-bg-elev)', border: '1px solid var(--qg-line)',
          borderRadius: 'var(--qg-radius-md)', boxShadow: 'var(--qg-shadow-2)',
          minWidth: 240, overflow: 'hidden',
        }}>
          {/* Todas as edições */}
          <button
            onClick={toggleAll}
            style={{
              ...rowStyle(isAllSelected),
              borderBottom: '1px solid var(--qg-line)',
            }}
            onMouseEnter={e => { if (!isAllSelected) e.currentTarget.style.background = 'var(--qg-bg-sub)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = isAllSelected ? 'var(--qg-green-wash)' : 'var(--qg-bg-elev)'; }}
          >
            <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} />
            <span style={{
              fontFamily: 'var(--qg-font-display)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 13,
              color: isAllSelected ? 'var(--qg-green)' : 'var(--qg-fg-1)',
            }}>
              Todas as edições
            </span>
          </button>

          {/* Individual editions */}
          {editions.map((ed, i) => {
            const active = selected.has(ed.id);
            return (
              <button
                key={ed.id}
                onClick={() => toggleOne(ed.id)}
                style={{
                  ...rowStyle(active),
                  borderTop: i > 0 ? '1px solid var(--qg-line)' : 'none',
                  flexDirection: 'column', alignItems: 'flex-start', gap: 0,
                  padding: '0',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--qg-bg-sub)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = active ? 'var(--qg-green-wash)' : 'var(--qg-bg-elev)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 4px', width: '100%' }}>
                  <Checkbox checked={active} />
                  <span style={{
                    fontFamily: 'var(--qg-font-display)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 13,
                    color: active ? 'var(--qg-green)' : 'var(--qg-fg-1)',
                  }}>
                    {ed.label} · {ed.year}
                  </span>
                  {ed.status === 'upcoming' && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      background: 'var(--qg-clay-wash)', color: 'var(--qg-clay)',
                      padding: '2px 6px', borderRadius: 'var(--qg-radius-sm)', marginLeft: 'auto',
                    }}>
                      Em breve
                    </span>
                  )}
                  {ed.status === 'completed' && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      background: 'var(--qg-green-wash)', color: 'var(--qg-green)',
                      padding: '2px 6px', borderRadius: 'var(--qg-radius-sm)', marginLeft: 'auto',
                    }}>
                      Encerrado
                    </span>
                  )}
                </div>
                <div style={{ paddingLeft: 42, paddingBottom: 10, fontSize: 11, color: 'var(--qg-fg-3)' }}>
                  {statusText(ed)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
