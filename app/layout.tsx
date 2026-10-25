import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const sans = Inter({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const display = Manrope({ variable: "--font-display", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Trustline — verified income for freelancers", template: "%s · Trustline" },
  description: "Turns a freelancer's verified payments and real work activity into a credit report a bank officer can act on.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fafa" },
    { media: "(prefers-color-scheme: dark)", color: "#151c21" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} min-h-dvh antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
