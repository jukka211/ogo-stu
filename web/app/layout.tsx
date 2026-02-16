import type { Metadata } from "next";
import "./globals.css";
import { Inter, Sometype_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sometypeMono = Sometype_Mono({
  subsets: ["latin"],
  variable: "--font-sometype-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OGO S.T.U.",
  description: "Studio für Grafikdesign",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
<html
  lang="en"
  className={`${inter.variable} ${sometypeMono.variable}`}
  suppressHydrationWarning
>
  <body suppressHydrationWarning>{children}</body>
</html>
  );
}
