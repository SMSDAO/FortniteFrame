import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FortniteFrame - Farcaster Frame v2',
  description: 'A Farcaster Frame integrating Fortnite stats and smart wallet transactions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
