
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { DrivingProvider } from "@/context/driving-context";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'DriveRank Kosovë | Performance Ranking',
  description: 'Aplikacioni suprem për ndjekjen e performancës për entuziastët e makinave në Kosovë.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DriveRank KS',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sq" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
      </head>
      <body className="font-body antialiased bg-black text-foreground min-h-screen overflow-hidden selection:bg-accent/30" suppressHydrationWarning>
        <FirebaseClientProvider>
          <DrivingProvider>
            <div className="app-container">
              <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-safe">
                {children}
              </main>
            </div>
            <Toaster />
          </DrivingProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
