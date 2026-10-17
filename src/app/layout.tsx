import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Vibe Miles — Explore India\'s Best Tour Packages & Experiences',
    template: '%s | Vibe Miles',
  },
  description:
    'India\'s premier travel marketplace. Book verified tour packages, luxury houseboats, Himalayan treks, boutique homestays, and adventure experiences directly from local experts.',
  keywords: ['travel packages India', 'tour operator', 'travel marketplace', 'Kerala houseboat', 'Manali package', 'Goa villa'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://vibemiles.com',
    siteName: 'Vibe Miles',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full font-sans" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
