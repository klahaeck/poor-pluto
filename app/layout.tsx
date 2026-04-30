import type { Metadata } from "next";
import { GoogleAnalytics } from '@next/third-parties/google'
import "./globals.css";

export const metadata: Metadata = {
  title: "Poor Pluto",
  description: "A quiet chat with the most emotionally battered entity in the solar system.",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  openGraph: {
    title: "Poor Pluto",
    description: "A quiet chat with the most emotionally battered entity in the solar system.",
    images: [
      {
        url: "/favicon/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Poor Pluto site icon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Poor Pluto",
    description: "A quiet chat with the most emotionally battered entity in the solar system.",
    images: ["/favicon/android-chrome-512x512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
      <GoogleAnalytics gaId="G-LHYQZ26BXX" />
    </html>
  );
}
