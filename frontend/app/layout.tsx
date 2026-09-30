import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NaoCraft — จัดการ Minecraft Server',
  description: 'ระบบจัดการ Minecraft Server แบบ Web Application บน Next.js',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${outfit.variable} ${jetbrainsMono.variable} dark antialiased`}>
      <body className="min-h-screen bg-[#070a13] text-slate-100 font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
