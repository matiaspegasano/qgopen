'use client'

import { SessionProvider } from 'next-auth/react'

const DEV_SESSION = {
  user: {
    id: 'dev-matias',
    name: 'Matias Pegasano',
    email: 'matias@dev.local',
    image: null,
    playerName: 'Matias Pegasano',
    role: 'admin',
  },
  expires: '2099-01-01T00:00:00.000Z',
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider session={DEV_SESSION}>
      {children}
    </SessionProvider>
  )
}
