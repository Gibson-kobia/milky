import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import { ToastContainer } from '@/components/toast-container';
import { BottomNavigation } from '@/components/bottom-navigation';
import { Sidebar } from '@/components/sidebar';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Milky - Milk Collection & Farmer Payments',
  description: 'Fast operational milk collection and farmer payment management system',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🥛</text></svg>',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white">
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
      </body>
    </html>
  );
}
