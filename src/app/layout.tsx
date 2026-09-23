import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Docutrack — Your documents, organized around what you are trying to accomplish',
    template: '%s · Docutrack',
  },
  description:
    'Group documents into Topics and get AI-generated summaries, context and recommendations that understand each document as part of the bigger picture.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0d11' },
  ],
  width: 'device-width',
  initialScale: 1,
};

/**
 * The font variables are declared on <html>, not <body>: the :root token layer
 * in globals.css substitutes them, and a variable declared lower down would
 * make that substitution invalid — falling back to the browser's default serif.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
