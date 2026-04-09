import type { Metadata, Viewport } from "next";
import { Crimson_Text, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ClarityAnalytics } from "@/components/clarity-analytics";
import "./globals.css";

const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const display = Crimson_Text({
  variable: "--font-crimson-text",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Glaze Library — Ceramic Glaze Catalog, Combinations & Inventory",
    template: "%s | Glaze Library",
  },
  description:
    "Browse thousands of ceramic glazes from Mayco, AMACO, Coyote, Duncan, and Spectrum. See firing images, glaze combinations, and community results. Free to use.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"),
  ),
  openGraph: {
    type: "website",
    siteName: "Glaze Library",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "/",
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
      data-scroll-behavior="smooth"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-50 bg-foreground px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:outline-none focus:ring-4 focus:ring-foreground/20"
        >
          Skip to content
        </a>
        {children}
        <Analytics />
        {clarityProjectId ? <ClarityAnalytics projectId={clarityProjectId} /> : null}
      </body>
    </html>
  );
}
