// app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "./client-providers";
import { VT323 } from "next/font/google";

const vt323 = VT323({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "POSUM Protocol",
  description: "A gamified, multi-chain yield and liquidity protocol.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${vt323.className} bg-[#1a1a1a]`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
