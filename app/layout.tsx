import type { Metadata } from "next";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "DuaMaker | CMU-Q MSA",
  description: "Community-driven Islamic supplication database",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoArabic.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-slate-900 text-slate-100 min-h-screen flex flex-col" suppressHydrationWarning>
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="py-6 text-center text-slate-500 text-sm">
          <p>CMU-Q Muslim Student Association</p>
        </footer>
      </body>
    </html>
  );
}
