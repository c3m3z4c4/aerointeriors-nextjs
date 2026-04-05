import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n/LangContext";
import { Toaster } from "sonner";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aircraft Interiors Solutions | Premium Aviation Interior Design",
  description:
    "Specialists in aircraft interior design and refurbishment. FAA Part 145 certified. Full interiors, leather work, wood veneer, LED lighting, and more.",
  keywords: "aircraft interior, aviation design, FAA Part 145, private jet interior, cabin refurbishment",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable}`}>
      <body>
        <div className="grain" aria-hidden="true" />
        <LangProvider>
          {children}
          <Toaster theme="dark" position="bottom-right" />
        </LangProvider>
      </body>
    </html>
  );
}
