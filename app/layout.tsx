import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const lineSeedSansTH = localFont({
  variable: "--font-line-seed-sans-th",
  display: "swap",
  src: [
    { path: "./fonts/LINESeedSansTH-Thin.woff2", weight: "100", style: "normal" },
    { path: "./fonts/LINESeedSansTH-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/LINESeedSansTH-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/LINESeedSansTH-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "./fonts/LINESeedSansTH-Black.woff2", weight: "900", style: "normal" },
  ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swordle — the daily SwiftUI puzzle",
  description: "A new SwiftUI puzzle every day. 60 seconds. Keep your streak alive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lineSeedSansTH.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
