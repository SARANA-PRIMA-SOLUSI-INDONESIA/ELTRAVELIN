import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PWAInstall from "@/components/PWAInstall";
import WhatsAppButton from "@/components/WhatsAppButton";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EL Travel | The Executive Transit Experience",
  description: "Experience premium travel with EL Travel. VIP concierge service, modern fleet, and door-to-door convenience.",
  icons: {
    apple: "/images/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EL Travel",
  },
};

export const viewport = {
  themeColor: "#0A1628",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${manrope.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-body bg-background text-foreground selection:bg-gold-soft selection:text-navy-deep">
        <div className="print:hidden"><Navbar /></div>
        <main className="flex-grow">{children}</main>
        <div className="print:hidden"><Footer /></div>
        <div className="print:hidden"><WhatsAppButton /></div>
        <div className="print:hidden"><PWAInstall /></div>
        <Analytics />
      </body>
    </html>
  );
}
