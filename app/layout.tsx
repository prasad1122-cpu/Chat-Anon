import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anonymous Chat (Free MVP)',
  description: 'Text-only anonymous chat using Firebase (free).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
