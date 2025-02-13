import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Link Status Log',
  description: 'Real-time Performance Monitoring',
  icons: {
    icon: '/favicon.ico', // This points to the file in public/
  },
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
