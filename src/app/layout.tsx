import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import Link from 'next/link';
import { Github, Instagram } from 'lucide-react';

import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { APP_NAME } from '@/lib/constants';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Updated metadata for PWA
export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Aplikasi patungan untuk membagi tagihan dengan mudah.',
  manifest: '/manifest.json', // Link to the manifest file
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
};

// -- Footer Component (No changes) --
function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="mt-auto py-6">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center text-center sm:gap-6 gap-4 text-sm text-muted-foreground">
        <p>
          &copy; {currentYear}{' '}
          <a
            href="https://www.instagram.com/mysteriza/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-primary transition-colors"
          >
            Mysteriza
          </a>
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Mysteriza/split-bill-web"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="GitHub Repository"
          >
            <Github className="h-5 w-5" />
          </a>
          <a
            href="https://www.instagram.com/mysteriza/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="Instagram & Feedback"
          >
            <Instagram className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Added for PWA theme color */}
        <meta name="theme-color" content="#f9f6f2" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased flex flex-col',
          fontSans.variable
        )}
      >
        {children}
        <Toaster />
        <Footer />
      </body>
    </html>
  );
}