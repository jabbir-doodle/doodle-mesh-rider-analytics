// app/layout.tsx
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToolProvider } from '@/components/context/ToolContext';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-y-auto">
        <ThemeProvider>
          <ToolProvider>
            {children}
          </ToolProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}