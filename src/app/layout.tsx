import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import { ToastContainer } from '@/components/toast-container';
import { DiagnosticOverlay } from '@/components/DiagnosticOverlay';

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
      <body className="bg-gray-50">
        {children}
        <ToastContainer />
        <DiagnosticOverlay />
      </body>
    </html>
  );
}
