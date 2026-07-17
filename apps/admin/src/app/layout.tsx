import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MaiThing Admin',
  description: 'MaiThing platform administration console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
