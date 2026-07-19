import type { Metadata } from 'next';
import './globals.css';
import { initSentry } from '@/lib/sentry';
import { capture } from '@/lib/posthog';

initSentry();
capture('admin_boot');

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
