import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://marshalltransports.com"),
  alternates: {
    canonical: "https://marshalltransports.com",
  },
  title: "MARSHALL TRANSPORTS LLC | Owner-Operator Partnership",
  description: "Partnering with independent owner-operators across America. Specializing in dry van, power-only freight services built on safety, integrity, and compliance.",
  keywords: [
    "Marshall Transports",
    "Marshall Transports LLC",
    "owner-operator partnership",
    "power-only trucking",
    "dry van carrier",
    "trucking company Tennessee",
    "lease-on programs",
    "fuel cards for truckers",
    "plate assistance trucking",
    "safety compliance logistics",
    "FMCSA certified carrier"
  ],
  authors: [{ name: "Marshall Transports LLC" }],
  openGraph: {
    title: "MARSHALL TRANSPORTS LLC | Owner-Operator Partnership",
    description: "Partnering with independent owner-operators across America. Specializing in dry van, power-only freight services built on safety, integrity, and compliance.",
    url: "https://marshalltransports.com",
    siteName: "Marshall Transports LLC",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Marshall Transports LLC Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MARSHALL TRANSPORTS LLC | Owner-Operator Partnership",
    description: "Partnering with independent owner-operators across America. Specializing in dry van, power-only freight services.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
