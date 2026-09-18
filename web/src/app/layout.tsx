import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { SITE } from "@/config/site";
import "./globals.css";

/**
 * Labels and addresses are the product, and they are set in mono everywhere
 * they appear. The system stack renders them as Menlo on most machines, which is
 * cramped and uneven at small sizes. Self hosted at build time, so no request
 * leaves the page.
 */
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} - ${SITE.tagline}`,
    template: `%s - ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
