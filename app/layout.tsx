import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Rocket - Solana Crash Game",
  description: "Official Whop Solana Crash Game - Play and win with cryptocurrency",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Jersey+15&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${spaceGrotesk.variable} antialiased`}
        style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
