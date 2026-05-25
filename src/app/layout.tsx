import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'QG Open · 2026',
  description: 'Campeonato amador de tênis · Alphaville · São Paulo · 1ª Edição',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Nav />
            <div className="nav-spacer" />
            <main style={{ flex: 1 }}>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
