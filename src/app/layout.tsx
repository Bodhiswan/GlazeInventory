import type { Metadata } from "next";
import { Crimson_Text, Inter } from "next/font/google";
import "./globals.css";

const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const display = Crimson_Text({
  variable: "--font-crimson-text",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Glaze Inventory",
    template: "%s | Glaze Inventory",
  },
  description:
    "Manage your glaze inventory, search glaze colours and cone ranges, and keep track of what is still on your shelf.",
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
      </body>
    </html>
  );
}
