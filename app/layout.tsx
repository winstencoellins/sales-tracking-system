import type { Metadata } from "next";
import { Source_Serif_4, Work_Sans } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";
import { cn } from "@/lib/utils";

/** Headings: Work Sans Bold */
const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

/** Body / charts: Source Serif 4 */
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={cn(
        "h-full font-sans antialiased",
        workSans.variable,
        sourceSerif.variable,
      )}
    >
      <body className="min-h-full">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
