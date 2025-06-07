import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import QueryProvider from "@/components/QueryProvider";
import CacheStatus from "@/components/CacheStatus";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eternal Soul - Your Cosmic Blueprint",
  description: "Discover your soul's blueprint through astrology. Get personalized insights, daily reflections, and unlock your cosmic potential.",
  keywords: "astrology, natal chart, soul blueprint, cosmic insights, spiritual guidance",
  authors: [{ name: "Srishty Mullick" }],
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          {children}
          <CacheStatus />
        </QueryProvider>
      </body>
    </html>
  );
}
