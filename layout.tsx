import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  Cairo,
  Fraunces,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans-en',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display-en',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FOREST+ | Grow Your Focus. Build Your World.',
  description:
    'The Ultimate Personal Focus & Productivity Ecosystem with Realistic Procedural 3D Tree Growth, Personal Forest Customization, and Bilingual English/Arabic Support.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${cairo.variable}`}
    >
      <body className="bg-[#F4F8F2] dark:bg-[#14251B] text-[#16261C] dark:text-[#FAF8EF] antialiased selection:bg-[#3D7950] selection:text-white">
        {children}
      </body>
    </html>
  );
}
