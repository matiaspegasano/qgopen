'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import { games, groupMatchesByEdition, mainBracketE2, consolationBracketE2, editions } from '@/lib/data'

const publicLinks = [
  { href: '/',        label: 'Início'   },
  { href: '/draws',   label: 'Chaves'   },
  { href: '/ranking', label: 'Ranking'  },
]
const painelLink = { href: '/painel', label: 'Painel do Jogador' }

/* ------------------------------------------------------------------ */
/* NOTIFICATIONS                                                       */
/* ------------------------------------------------------------------ */

type Notif = {
  id: string
  pinned?: true
  read: boolean
  time: string
  label: string
  body: string
  type: 'action' | 'warning' | 'result' | 'schedule'
}

function buildNotifs(playerName: string | null): Notif[] {
  // Recent results from games (general, most recent first)
  const recentResults: Notif[] = [...games].reverse().slice(0, 7).map(g => ({
    id: `r-${g.id}`,
    read: true,
    time: `${g.day} ${g.month}`,
    label: `Resultado · ${g.round.split(' — ')[0]}`,
    body: g.wo
      ? `${g.result.split('— ')[1] ?? g.p1} avança por W.O. (${g.p1} × ${g.p2})`
      : `${g.p1} × ${g.p2} — ${g.result}`,
    type: 'result' as const,
  }))

  if (!playerName) return recentResults

  // Personalized: upcoming matches for the logged-in player
  const activeEd = editions.find(e => e.status === 'active')
  const pending: Notif[] = []
  if (activeEd) {
    const groupMs = Object.values(groupMatchesByEdition[activeEd.id] ?? {}).flat()
    const bracketMs = [
      ...mainBracketE2.flatMap(c => c.matches),
      ...consolationBracketE2.flatMap(c => c.matches),
    ]
    const myPending = [
      ...groupMs.filter(m => (m.p1.name === playerName || m.p2.name === playerName) && m.winner === undefined),
      ...bracketMs.filter(m => (m.p1.name === playerName || m.p2.name === playerName) && !m.p1.w && !m.p2.w),
    ]
    myPending.slice(0, 2).forEach(m => {
      const opp = m.p1.name === playerName ? m.p2.name : m.p1.name
      pending.push({
        id: `up-${m.id}`,
        pinned: true,
        read: false,
        time: 'Pendente',
        label: 'Partida disponível',
        body: `${m.round} · Você × ${opp} — agende sua partida.`,
        type: 'action',
      })
    })
  }

  return [...pending, ...recentResults]
}

const typeAccent: Record<Notif['type'], string> = {
  action:   'var(--qg-green)',
  warning:  'var(--qg-clay)',
  result:   'var(--qg-fg-3)',
  schedule: '#6366f1',
}

const typeIcon: Record<Notif['type'], React.ReactNode> = {
  action: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  warning: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  result: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  schedule: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
}

function NotifItem({ n }: { n: Notif }) {
  const accent = typeAccent[n.type]
  const isPinned = !!n.pinned
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '14px 20px',
      borderLeft: `3px solid ${accent}`,
      background: isPinned
        ? (n.type === 'action' ? 'rgba(5,72,47,0.04)' : 'rgba(211,82,32,0.04)')
        : n.read ? 'transparent' : 'rgba(0,0,0,0.02)',
      borderBottom: '1px solid var(--qg-line)',
    }}>
      <div style={{ flexShrink: 0, marginTop: 2, color: accent }}>{typeIcon[n.type]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent }}>
            {n.label}
          </span>
          <span style={{ fontSize: 10, color: 'var(--qg-fg-4)', flexShrink: 0 }}>{n.time}</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: isPinned ? 'var(--qg-fg-1)' : 'var(--qg-fg-2)', lineHeight: 1.5 }}>
          {n.body}
        </p>
      </div>
      {!n.read && (
        <div style={{ flexShrink: 0, marginTop: 6, width: 7, height: 7, borderRadius: '50%', background: accent }} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* NAV                                                                 */
/* ------------------------------------------------------------------ */

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen]               = useState(false)
  const [notifOpen, setNotifOpen]     = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  // ref is on the outer wrapper so outside-click detection covers both
  // the header and the dropdown panels
  const wrapperRef  = useRef<HTMLDivElement>(null)
  const profileRef  = useRef<HTMLDivElement>(null)
  const { data: session, status } = useSession()

  useEffect(() => { setOpen(false); setNotifOpen(false); setProfileOpen(false) }, [pathname])

  // pointerdown fires on both mouse and touch, avoiding the 300 ms iOS delay
  useEffect(() => {
    if (!open) return
    const h = (e: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', h)
    return () => document.removeEventListener('pointerdown', h)
  }, [open])

  useEffect(() => {
    if (!notifOpen) return
    const h = (e: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('pointerdown', h)
    return () => document.removeEventListener('pointerdown', h)
  }, [notifOpen])

  useEffect(() => {
    if (!profileOpen) return
    const h = (e: PointerEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('pointerdown', h)
    return () => document.removeEventListener('pointerdown', h)
  }, [profileOpen])

  const playerName  = session?.user?.playerName ?? null
  const displayName = playerName ?? session?.user?.name ?? null
  const isPlayer    = status === 'authenticated' && !!playerName

  const navLinks = isPlayer
    ? [publicLinks[0], painelLink, ...publicLinks.slice(1)]
    : publicLinks

  const notifs      = buildNotifs(isPlayer ? playerName : null)
  const pinnedNotifs = notifs.filter(n => n.pinned)
  const feedNotifs   = notifs.filter(n => !n.pinned)
  const unreadCount  = notifs.filter(n => !n.read).length

  return (
    /* nav-wrapper is the sticky container — position:sticky lives here,
       NOT on the header, so that backdrop-filter on the header doesn't
       break touch events on iOS Safari */
    <div className="nav-wrapper" ref={wrapperRef}>
      <header className="nav">
        <Link href="/" className="nav-brand">
          <Image src="/logo.png" alt="QG Open" width={36} height={36} priority />
          <span className="nav-brand-name">QG Open</span>
        </Link>

        <nav className="nav-links">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={'nav-link' + (pathname === href ? ' active' : '')}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="nav-right">
          {/* Bell */}
          <button
            className="nav-bell"
            aria-label="Notificações"
            onClick={() => { setNotifOpen(o => !o); setOpen(false) }}
            style={{ position: 'relative' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 0,
                minWidth: 16, height: 16, borderRadius: 8,
                background: 'var(--qg-clay)', color: '#fff',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', lineHeight: 1,
                border: '1.5px solid #fff',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Desktop: profile button or login */}
          {status === 'authenticated' ? (
            <div className="nav-user-desktop" ref={profileRef} style={{ position: 'relative' }}>
              <button
                className={'nav-player-btn' + (profileOpen ? ' open' : '')}
                onClick={() => setProfileOpen(o => !o)}
              >
                <span>{displayName}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: 'transform 160ms', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileOpen && (
                <div className="nav-profile-dropdown">
                  {session?.user?.role === 'admin' && (
                    <Link href="/admin" className="nav-profile-item" onClick={() => setProfileOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <button
                    className="nav-profile-item nav-profile-item--danger"
                    onClick={() => { setProfileOpen(false); signOut() }}
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="nav-login-btn" onClick={() => signIn('google')}>
              Entrar
            </button>
          )}

          {/* Hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => { setOpen(o => !o); setNotifOpen(false) }}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          >
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6"  x2="21" y2="6"  />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {notifOpen && (
        <div className="nav-notif-panel">
          <div className="nav-notif-header">
            <span>Notificações</span>
            {unreadCount > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                background: 'var(--qg-clay)', color: '#fff',
                borderRadius: 10, padding: '2px 8px',
              }}>
                {unreadCount} novas
              </span>
            )}
          </div>
          <div className="nav-notif-section-label">Para você</div>
          {pinnedNotifs.map(n => <NotifItem key={n.id} n={n} />)}
          <div className="nav-notif-section-label" style={{ marginTop: 4 }}>Atividade</div>
          {feedNotifs.map(n => <NotifItem key={n.id} n={n} />)}
        </div>
      )}

      {open && (
        <div className="nav-dropdown">
          {status === 'authenticated' ? (
            <>
              <div className="nav-dropdown-player">
                <div className="nav-dropdown-player-dot" />
                <span>{displayName}</span>
              </div>
              <div className="nav-dropdown-divider" />
            </>
          ) : null}

          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={'nav-dropdown-link' + (pathname === href ? ' active' : '')}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}

          {session?.user?.role === 'admin' && (
            <>
              <div className="nav-dropdown-divider" />
              <Link href="/admin" className="nav-dropdown-link" onClick={() => setOpen(false)}>
                Admin
              </Link>
            </>
          )}

          <div className="nav-dropdown-divider" />
          {status === 'authenticated' ? (
            <button
              className="nav-dropdown-link"
              onClick={() => { setOpen(false); signOut() }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: 'var(--qg-clay)' }}
            >
              Sair
            </button>
          ) : (
            <button
              className="nav-dropdown-link"
              onClick={() => { setOpen(false); signIn('google') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: 'var(--qg-green)' }}
            >
              Entrar com Google
            </button>
          )}
        </div>
      )}
    </div>
  )
}
