'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Edition } from '@/lib/data';

export default function AnnouncementBanner({ edition }: { edition: Edition }) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  return (
    <div className="announcement-banner" style={{
      background: 'var(--qg-clay)', color: 'var(--qg-cream)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28,
      padding: '4px 36px', fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
      position: 'relative',
    }}>
      <span style={{ fontFamily: 'var(--qg-font-display)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
        Em andamento
      </span>
      <span>
        {edition.label} iniciada em <span style={{ fontWeight: 600 }}>{edition.startDate}</span>. Resultados serão exibidos conforme as partidas forem disputadas.
      </span>
      <Link href="/draws" onClick={() => setClosed(true)} style={{
        color: 'var(--qg-cream)', borderBottom: '1px solid rgba(255,255,255,0.5)',
        fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '0.06em',
      }}>
        Ver chaveamento →
      </Link>
      <button
        onClick={() => setClosed(true)}
        style={{
          position: 'absolute', right: 16,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1,
          padding: '0 4px', transition: 'color 140ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
        aria-label="Fechar aviso"
      >
        ×
      </button>
    </div>
  );
}
