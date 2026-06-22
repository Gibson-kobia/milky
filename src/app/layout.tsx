import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import { ToastContainer } from '@/components/toast-container';
import { BottomNavigation } from '@/components/bottom-navigation';
import { Sidebar } from '@/components/sidebar';
import { InstallPrompt } from '@/components/install-prompt';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Milky - Milk Collection & Farmer Payments',
  description: 'Fast operational milk collection and farmer payment management system',
  icons: [
    { rel: 'icon', url: '/icons/icon-192x192.png' },
    { rel: 'icon', url: '/icons/icon-512x512.png' },
    { rel: 'apple-touch-icon', url: '/icons/apple-touch-icon.png' },
  ],
  appleWebApp: {
    capable: true,
    title: 'Milky',
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#16a34a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white min-h-screen overflow-x-hidden">
        <div className="min-h-screen">
          <div className="lg:flex">
            <Sidebar />
            <main className="flex-1">
              <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </div>
        <BottomNavigation />
        <ToastContainer />
        <InstallPrompt />
      </body>
    </html>
  );
}
