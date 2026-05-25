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
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      if (isAdmin(user.email)) return true
      const invite = await prisma.invite.findUnique({ where: { email: user.email } })
      return !!invite
    },
    async session({ session, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          role: (user as any).role ?? 'player',
          playerName: (user as any).playerName ?? null,
        },
      }
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return
      const updates: Record<string, unknown> = {}
      if (isAdmin(user.email)) updates.role = 'admin'
      const invite = await prisma.invite.findUnique({ where: { email: user.email } })
      if (invite && !invite.usedAt) {
        updates.playerName = invite.playerName
        await prisma.invite.update({ where: { email: user.email }, data: { usedAt: new Date() } })
      }
      if (Object.keys(updates).length > 0) {
        await prisma.user.update({ where: { id: user.id }, data: updates })
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
