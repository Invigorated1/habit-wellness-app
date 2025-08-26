import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProviderWrapper } from "./providers/clerk-provider";
import { PostHogProvider } from "./providers/PostHogProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense } from "react";
import { reportWebVitals } from '@/lib/performance';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Habit Wellness App",
  description: "Track your daily habits and build a better you",
};

// Export web vitals reporting
export { reportWebVitals };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ClerkProviderWrapper>
            <Suspense fallback={null}>
              <PostHogProvider>
                {children}
              </PostHogProvider>
            </Suspense>
          </ClerkProviderWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
