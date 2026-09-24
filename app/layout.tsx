import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RailGaadi — Live Indian Train Tracker",
  description:
    "Track any Indian train live. See real-time location on an interactive map, delays, ETAs, and what's along the route — weather, rivers, mountains, landmarks.",
  keywords:
    "train tracking, live train status, Indian Railways, NTES, where is my train, train delay, train map",
  authors: [{ name: "Yash Shah — Build & Beyond, ISTE KJSCE" }],
  openGraph: {
    title: "RailGaadi — Live Indian Train Tracker",
    description: "Track any Indian train live on a beautiful interactive map.",
    type: "website",
    siteName: "RailGaadi",
  },
  twitter: {
    card: "summary_large_image",
    title: "RailGaadi",
    description: "Live Indian train tracking, beautifully done.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1A6FE8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
