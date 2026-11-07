import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navigation/Navbar";

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Word Games Hub & Equal-Weight Leaderboard",
  description:
    "Real-time multiplayer daily word game tracking platform for Wordle, Word500, Krillion, and custom daily games with 0-100 equal-weight score normalization and WCAG 2.1 AA compliance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${atkinson.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased bg-wcag-bg text-wcag-text pb-20 md:pb-10">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-wcag-accent focus:px-4 focus:py-3 focus:font-bold focus:text-wcag-accentText"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
