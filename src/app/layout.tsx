import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Mukta } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", weight: ["500", "700", "800"] });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", weight: ["400", "500", "600", "700"] });
const mukta = Mukta({ subsets: ["devanagari", "latin"], variable: "--font-mukta", weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "GapLens · find the dark spots in your sources",
  description: "Add a question and a few sources. GapLens shows what's confirmed, what's missing, what disagrees, what may be outdated, and what to verify next, with exact quotes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} ${instrument.variable} ${mukta.variable}`}>{children}</body>
    </html>
  );
}
