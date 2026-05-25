'use client'

import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const params = useSearchParams()
  const error = params.get('error')

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--qg-bg)', padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: '#fff', borderRadius: 'var(--qg-radius-lg)',
        border: '1px solid var(--qg-line)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--qg-green)', padding: '28px 32px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <Image src="/logo.png" alt="QG Open" width={48} height={48} />
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--qg-font-display)', fontSize: 20, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--qg-cream)',
            }}>QG Open</div>
            <div style={{
              fontSize: 11, color: 'rgba(234,241,236,0.7)', letterSpacing: '0.1em',
              textTransform: 'uppercase', fontWeight: 500, marginTop: 2,
            }}>Campeonato · 2026</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{
            fontFamily: 'var(--qg-font-display)', fontSize: 15, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--qg-fg-1)',
            marginBottom: 6,
          }}>Acesso ao sistema</div>
          <div style={{ fontSize: 13, color: 'var(--qg-fg-3)', lineHeight: 1.5, marginBottom: 24 }}>
            Exclusivo para jogadores cadastrados. Faça login com a sua conta Google para acessar.
          </div>

          {error === 'AccessDenied' && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 6,
              padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 20,
            }}>
              Acesso não autorizado. Solicite um convite ao administrador.
            </div>
          )}

          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              padding: '12px 20px', borderRadius: 8,
              background: '#fff', border: '1px solid var(--qg-line)',
              cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--qg-fg-1)',
              transition: 'box-shadow 150ms, border-color 150ms',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'
              e.currentTarget.style.borderColor = '#aaa'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
              e.currentTarget.style.borderColor = 'var(--qg-line)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
