import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from '../components/ThemeProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Mesh Rider ToolBox",
  description: "Mesh Rider network configuration, monitoring, and management tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}