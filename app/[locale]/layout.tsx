import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "../globals.css";

const lineSeedSansTH = localFont({
  variable: "--font-line-seed-sans-th",
  display: "swap",
  src: [
    { path: "../fonts/LINESeedSansTH-Thin.woff2", weight: "100", style: "normal" },
    { path: "../fonts/LINESeedSansTH-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/LINESeedSansTH-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/LINESeedSansTH-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../fonts/LINESeedSansTH-Black.woff2", weight: "900", style: "normal" },
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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // Opt this layout into static rendering for the chosen locale (next-intl).
  setRequestLocale(locale);
  return (
    <html
      lang={locale}
      className={`${lineSeedSansTH.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <Header />
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
