import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
