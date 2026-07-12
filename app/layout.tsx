import type { Metadata } from "next";
import { Lexend, Source_Sans_3, Inter } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

/** Lexend: high readability, designed for reading fluency (good for 40+). */
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

/** Clear secondary face for prices/numbers with strong figure shapes. */
const sourceSans = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sales Tracking System",
  description: "Kelola penjualan, pelanggan, dan laporan dalam satu tempat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={cn("h-full", "antialiased", lexend.variable, sourceSans.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
