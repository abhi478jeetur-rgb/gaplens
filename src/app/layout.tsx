import type { Metadata } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans, Mukta } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({ subsets: ["latin"], variable: "--font-serif", weight: "400" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["400", "500", "600", "700", "800"] });
const mukta = Mukta({ subsets: ["devanagari", "latin"], variable: "--font-mukta", weight: ["400", "500", "600"] });

const SITE = "https://gaplens-nine.vercel.app";
const TITLE = "GapLens · Find what your sources hide";
const DESC = "Ask one question, add a few links. GapLens shows what's confirmed, what's missing, what conflicts and what's outdated, with the exact quote behind every finding. Free, open source, English and Hindi.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESC,
  applicationName: "GapLens",
  keywords: ["GapLens", "information gaps", "source verification", "fact check", "scholarship", "open source", "Hindi"],
  authors: [{ name: "Abhijeet Kumar", url: "https://x.com/Abhijeetkuumar" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "GapLens",
    title: TITLE,
    description: DESC,
    locale: "en_IN",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "GapLens: Find what your sources hide" }],
    videos: [{ url: `${SITE}/gaplens-demo-1080.mp4`, width: 1920, height: 1080, type: "video/mp4" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    creator: "@Abhijeetkuumar",
    images: [{ url: "/og.jpg", alt: "GapLens: Find what your sources hide" }],
  },
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
