
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { DrivingProvider } from "@/context/driving-context";
<<<<<<< HEAD
=======
import { OnboardingWrapper } from "@/components/layout/onboarding-wrapper";
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
<<<<<<< HEAD
=======
  weight: ['300', '400', '500', '600', '700', '800', '900'],
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
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
<<<<<<< HEAD
      <body className="font-body antialiased bg-black text-foreground min-h-screen overflow-hidden selection:bg-accent/30" suppressHydrationWarning>
        <FirebaseClientProvider>
          <DrivingProvider>
            <div className="app-container">
              <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-safe">
                {children}
              </main>
            </div>
=======
      <body className="bg-black overflow-hidden selection:bg-accent/30 font-sans" suppressHydrationWarning>
        <FirebaseClientProvider>
          <DrivingProvider>
            <OnboardingWrapper>
              <div className="app-container">
                <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
                  {children}
                </main>
              </div>
            </OnboardingWrapper>
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
            <Toaster />
          </DrivingProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
