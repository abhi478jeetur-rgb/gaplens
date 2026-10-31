import type { Metadata } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans, Mukta } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({ subsets: ["latin"], variable: "--font-serif", weight: "400" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["400", "500", "600", "700", "800"] });
const mukta = Mukta({ subsets: ["devanagari", "latin"], variable: "--font-mukta", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "GapLens · find the gaps in your sources",
  description: "Add a question and a few sources. GapLens shows what's confirmed, what's missing, what disagrees, what may be outdated, and what to verify next, with exact quotes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${serif.variable} ${jakarta.variable} ${mukta.variable}`}>
      <head>
        <meta name="theme-color" content="#1d8fb8" />
        <script dangerouslySetInnerHTML={{ __html: "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('js-enter');setTimeout(function(){document.documentElement.classList.remove('js-enter')},3500)}}catch(e){}" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
