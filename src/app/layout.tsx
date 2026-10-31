import type { Metadata } from "next";
import { Schibsted_Grotesk, IBM_Plex_Mono, Mukta } from "next/font/google";
import "./globals.css";

const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", weight: ["400", "500", "600"] });
const plex = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-plex", weight: ["300", "400", "500"] });
const mukta = Mukta({ subsets: ["devanagari", "latin"], variable: "--font-mukta", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "GapLens · find the gaps in your sources",
  description: "Add a question and a few sources. GapLens shows what's confirmed, what's missing, what disagrees, what may be outdated, and what to verify next, with exact quotes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${schibsted.variable} ${plex.variable} ${mukta.variable}`}>{children}</body>
    </html>
  );
}
