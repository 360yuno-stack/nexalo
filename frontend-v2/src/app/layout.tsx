import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "Nexalo | Institutional Decentralized Lottery",
  description: "Autonomous DeFi Lottery Protocol on BNB Chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-[#0B0D17] text-white min-h-screen font-sans`}>
        <Providers>
          {children}
          <Toaster theme="dark" position="bottom-right" richColors toastOptions={{
            style: {
              background: 'rgba(30, 30, 60, 0.9)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              backdropFilter: 'blur(10px)',
              color: 'white',
            }
          }} />
        </Providers>
      </body>
    </html>
  );
}
