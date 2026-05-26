import NextAuth, { type DefaultSession } from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      playerName: string | null
    } & DefaultSession['user']
  }
  interface User {
    role: string
    playerName: string | null
  }
}

function isAdmin(email: string | null | undefined) {
  return email && email === process.env.ADMIN_EMAIL
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      if (isAdmin(user.email)) return true
      const invite = await prisma.invite.findUnique({ where: { email: user.email } })
      return !!invite
    },
    async session({ session, user }) {
      let playerName: string | null = (user as any).playerName ?? null
      let role: string = (user as any).role ?? 'player'

      if ((!playerName || role === 'player') && session.user?.email) {
        const updates: Record<string, unknown> = {}
        if (!playerName) {
          const invite = await prisma.invite.findUnique({ where: { email: session.user.email } })
          if (invite) {
            playerName = invite.playerName
            updates.playerName = playerName
            if (!invite.usedAt) {
              await prisma.invite.update({ where: { email: session.user.email }, data: { usedAt: new Date() } })
            }
          }
        }
        if (isAdmin(session.user.email) && role !== 'admin') {
          role = 'admin'
          updates.role = 'admin'
        }
        if (Object.keys(updates).length > 0) {
          await prisma.user.update({ where: { id: user.id }, data: updates })
        }
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          role,
          playerName,
        },
      }
    },
  },
  events: {
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
