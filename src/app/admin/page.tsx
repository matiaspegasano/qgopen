import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { players } from '@/lib/data'

async function addInvite(formData: FormData) {
  'use server'
  const email = (formData.get('email') as string).trim().toLowerCase()
  const playerName = formData.get('playerName') as string
  if (!email || !playerName) return
  await prisma.invite.upsert({
    where: { email },
    update: { playerName },
    create: { email, playerName },
  })
  revalidatePath('/admin')
}

async function deleteInvite(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  await prisma.invite.delete({ where: { id } })
  revalidatePath('/admin')
}

export default async function AdminPage() {
  const session = await auth()

  const isAdmin = session?.user?.role === 'admin' || session?.user?.email === process.env.ADMIN_EMAIL
  if (!isAdmin) redirect('/')

  const invites = await prisma.invite.findMany({ orderBy: { createdAt: 'desc' } })
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--qg-fg-3)', marginBottom: 4 }}>
          Administração
        </div>
        <div style={{ fontFamily: 'var(--qg-font-display)', fontSize: 28, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--qg-fg-1)' }}>
          Painel Admin
        </div>
      </div>

      {/* Add invite */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">Convidar jogador</div>
        <form action={addInvite} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--qg-fg-3)' }}>
                E-mail Google
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="jogador@gmail.com"
                style={{
                  padding: '8px 12px', borderRadius: 6, border: '1px solid var(--qg-line)',
                  fontSize: 13, color: 'var(--qg-fg-1)', background: '#fff',
                  outline: 'none', width: '100%',
                }}
              />
            </div>
            <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--qg-fg-3)' }}>
                Jogador
              </label>
              <select
                name="playerName"
                required
                style={{
                  padding: '8px 12px', borderRadius: 6, border: '1px solid var(--qg-line)',
                  fontSize: 13, color: 'var(--qg-fg-1)', background: '#fff',
                  outline: 'none', width: '100%',
                }}
              >
                <option value="">Selecionar...</option>
                {players.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <button
              type="submit"
              style={{
                background: 'var(--qg-green)', color: 'var(--qg-cream)',
                border: 'none', borderRadius: 6, padding: '9px 20px',
                fontFamily: 'var(--qg-font-display)', fontSize: 12, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              Enviar convite
            </button>
          </div>
        </form>
      </div>

      {/* Invites list */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">Convites ({invites.length})</div>
        {invites.length === 0 ? (
          <div style={{ padding: '20px', color: 'var(--qg-fg-3)', fontSize: 13 }}>Nenhum convite criado.</div>
        ) : (
          <table className="standings" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>E-mail</th>
                <th style={{ textAlign: 'left' }}>Jogador</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invites.map(inv => (
                <tr key={inv.id}>
                  <td style={{ textAlign: 'left', fontSize: 13, color: 'var(--qg-fg-2)' }}>{inv.email}</td>
                  <td style={{ textAlign: 'left', fontSize: 13, fontWeight: 600 }}>{inv.playerName}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 10,
                      fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      background: inv.usedAt ? 'var(--qg-green-wash)' : 'var(--qg-clay-wash)',
                      color: inv.usedAt ? 'var(--qg-green)' : 'var(--qg-clay-deep)',
                    }}>
                      {inv.usedAt ? 'Ativo' : 'Pendente'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <form action={deleteInvite}>
                      <input type="hidden" name="id" value={inv.id} />
                      <button
                        type="submit"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--qg-fg-3)', fontSize: 13, padding: '2px 6px',
                        }}
                      >
                        ×
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Registered users */}
      <div className="card">
        <div className="card-header">Usuários registrados ({users.length})</div>
        {users.length === 0 ? (
          <div style={{ padding: '20px', color: 'var(--qg-fg-3)', fontSize: 13 }}>Nenhum usuário registrado.</div>
        ) : (
          <table className="standings" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Nome</th>
                <th style={{ textAlign: 'left' }}>E-mail</th>
                <th style={{ textAlign: 'left' }}>Jogador</th>
                <th style={{ textAlign: 'center' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ textAlign: 'left', fontSize: 13, fontWeight: 600 }}>{u.name ?? '—'}</td>
                  <td style={{ textAlign: 'left', fontSize: 12, color: 'var(--qg-fg-3)' }}>{u.email}</td>
                  <td style={{ textAlign: 'left', fontSize: 13 }}>{u.playerName ?? '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 10,
                      fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      background: u.role === 'admin' ? '#fef9e7' : 'var(--qg-bg-elev)',
                      color: u.role === 'admin' ? '#b7791f' : 'var(--qg-fg-3)',
                    }}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
