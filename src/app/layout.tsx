import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'arabaşikayet — Türkiye\'nin Araç Güvenilirlik Platformu',
  description: 'Araç sahiplerinin gerçek şikayetleri ile kronik arızaları keşfedin. Satın almadan önce araştırın.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <Navbar />
        <main className="pt-16 page-enter">{children}</main>
      </body>
    </html>
  );
}
