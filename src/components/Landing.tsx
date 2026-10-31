"use client";
// Landing layout adapted from the "Nexeus" cinematic hero brief the user supplied:
// a full-viewport painted video, a left-aligned hero and a glass footer. GapLens copy and links.
import { useEffect, useRef } from "react";
import type { Lang } from "@/lib/types";
import "./landing.css";
import LandingSections from "./LandingSections";

const REPO = "https://github.com/abhi478jeetur-rgb/gaplens";
const GITHUB = "https://github.com/abhi478jeetur-rgb";
const X_URL = "https://x.com/Abhijeetkuumar";
const INSTAGRAM = "https://www.instagram.com/abhi.jeetkuumar/";
// Demo video link (YouTube). Leave empty to hide the button.
const DEMO_VIDEO = "";

const COPY = {
  en: {
    eyebrow: "See past the clouds",
    h1: "Find what your sources hide",
    lede: "Add a question and a few links. GapLens shows what's confirmed, what's missing and what disagrees, with the exact quote behind every finding.",
    cta: "Try the demo",
    start: "or start your own",
    tagline: "AI-assisted information gap detection. Built for Shinchan Online Hackathon 2026.",
    cols: [
      { h: "Start", items: [["Scholarship demo", "demo"], ["Ask your own question", "start"], ["हिंदी में देखें", "lang"], ["Source code", "repo"]] },
      { h: "What it finds", items: [["Confirmed facts", "start"], ["Dark spots", "start"], ["Conflicts side by side", "start"], ["Outdated pages", "start"]] },
      { h: "What you get", items: [["Exact quotes", "start"], ["Coverage map", "start"], ["Verify next checklist", "start"], ["PDF and Markdown export", "start"]] },
    ],
    legal: "© 2026 GapLens. Always confirm on the official source.",
  },
  hi: {
    eyebrow: "बादलों के पार देखिए",
    h1: "स्रोत जो छुपाते हैं, वो देखिए",
    lede: "एक सवाल और कुछ लिंक जोड़िए। GapLens बताएगा क्या पक्का है, क्या गायब है और कहाँ बातें टकराती हैं, हर बात के साथ असली उद्धरण।",
    cta: "डेमो देखिए",
    start: "या अपना सवाल पूछिए",
    tagline: "AI की मदद से जानकारी की कमियाँ पकड़ने वाला टूल। Shinchan Online Hackathon 2026 के लिए।",
    cols: [
      { h: "शुरू करें", items: [["स्कॉलरशिप डेमो", "demo"], ["अपना सवाल पूछें", "start"], ["View in English", "lang"], ["सोर्स कोड", "repo"]] },
      { h: "क्या पकड़ता है", items: [["पक्की जानकारी", "start"], ["अंधेरे कोने", "start"], ["आमने-सामने टकराव", "start"], ["पुराने पेज", "start"]] },
      { h: "आपको मिलता है", items: [["असली उद्धरण", "start"], ["कवरेज नक्शा", "start"], ["जाँच की चेकलिस्ट", "start"], ["PDF और Markdown", "start"]] },
    ],
    legal: "© 2026 GapLens. अंतिम पुष्टि हमेशा आधिकारिक स्रोत से करें।",
  },
};

export default function Landing({ lang, onLang, onDemo, onStart }: { lang: Lang; onLang: () => void; onDemo: () => void; onStart: () => void }) {
  const c = COPY[lang];
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const el = root.current;
    if (!el || el.dataset.entered) return;
    el.dataset.entered = "1";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("animate" in el)) { html.classList.remove("js-enter"); return; }
    html.classList.add("js-enter");
    const EXPO = "cubic-bezier(.16,1,.3,1)", SOFT = "cubic-bezier(.22,.65,.28,1)", SETTLE = "cubic-bezier(.33,1,.68,1)";
    const small = window.matchMedia("(max-width: 648px)").matches;
    const d = small ? 0.62 : 1, t = small ? 0.85 : 1;
    const anims: Animation[] = [];
    const rise = (sel: string | Element[], y: number, dur: number, delay: number, ease = SOFT, step = 0) => {
      const list = typeof sel === "string" ? Array.from(el.querySelectorAll(sel)) : sel;
      list.forEach((n, i) => anims.push(n.animate(
        [{ opacity: 0, transform: `translate3d(0,${y * d}px,0)` }, { opacity: 1, transform: "none" }],
        { duration: dur, delay: (delay + i * step) * t, easing: ease, fill: "both" })));
    };
    rise(".eyebrow", 12, 560, 60);
    rise(".topbar", -8, 600, 40);
    const h = el.querySelector(".headline");
    if (h) anims.push(h.animate([{ transform: "translate3d(0,118%,0)" }, { transform: "none" }], { duration: 950, delay: 170 * t, easing: EXPO, fill: "both" }));
    rise(".lede", 14, 660, 430);
    el.querySelectorAll(".cta, .start").forEach((n) => anims.push(n.animate(
      [{ opacity: 0, transform: `translate3d(0,${12 * d}px,0) scale(.985)` }, { opacity: 1, transform: "none" }],
      { duration: 580, delay: 620 * t, easing: SETTLE, fill: "both" })));
    rise(".mark, .wordmark", 10, 540, 600);
    rise(".tagline", 10, 540, 670);
    rise(".col", 14, 580, 720, SOFT, 70);
    const rule = el.querySelector(".rule");
    if (rule) anims.push(rule.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 720, delay: 980 * t, easing: EXPO, fill: "both" }));
    rise(".legal", 8, 500, 1120);
    rise(".socials a", 8, 500, 1170, SOFT, 60);
    Promise.all(anims.map((a) => a.finished)).then(() => { html.classList.remove("js-enter"); anims.forEach((a) => a.cancel()); }).catch(() => html.classList.remove("js-enter"));
    return () => { html.classList.remove("js-enter"); };
  }, []);

  const act = (k: string) => (e: React.MouseEvent) => {
    if (k === "repo") return;
    e.preventDefault();
    if (k === "demo") onDemo(); else if (k === "lang") onLang(); else onStart();
  };

  return (
    <div className={`nx ${lang === "hi" ? "hi" : ""}`} ref={root}>
      <section className="viewport hero">
        <div className="bg">
          <video autoPlay muted loop playsInline poster="/hero.webp" aria-label="Painted alpine panorama: a lone hiker with a pink backpack faces a snow-capped peak above a sea of clouds">
            <source src="/hero.webm" type="video/webm" />
            <source src="/hero.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="scrim" aria-hidden />
        <header className="topbar">
          <span className="tb-brand">GapLens</span>
          <div className="tb-right">
            {DEMO_VIDEO && <a className="tb-demo" href={DEMO_VIDEO} target="_blank" rel="noreferrer"><span aria-hidden>▶</span> {lang === "hi" ? "डेमो वीडियो" : "Demo video"}</a>}
            <a href={GITHUB} target="_blank" rel="noreferrer" aria-label="GitHub"><svg viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z" /></svg></a>
            <a href={X_URL} target="_blank" rel="noreferrer" aria-label="X (Twitter)"><svg viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M18.2 2.3h3.4l-7.4 8.4 8.7 11.5h-6.8l-5.3-7-6.1 7H1.3l7.9-9L.9 2.3h7l4.8 6.4zm-1.2 17.9h1.9L7.1 4.2H5.1z" /></svg></a>
            <a href={INSTAGRAM} target="_blank" rel="noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden><path fill="none" stroke="currentColor" strokeWidth="2" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z" /><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.6" cy="6.4" r="1.3" fill="currentColor" /></svg></a>
          </div>
        </header>
        <main className="stage">
          <p className="eyebrow abs">{c.eyebrow}</p>
          <div className="headline-mask abs"><h1 className="headline">{c.h1}</h1></div>
          <p className="lede abs">{c.lede}</p>
          <div className="ctarow abs">
            <a className="cta" href="#demo" onClick={act("demo")}><span>{c.cta}</span></a>
            <a className="start" href="#start" onClick={act("start")}>{c.start} <span aria-hidden>→</span></a>
          </div>
        </main>
        <a className="scrollcue" href="#more" onClick={(e) => { e.preventDefault(); document.getElementById("more")?.scrollIntoView({ behavior: "smooth" }); }} aria-label="Scroll"><span /></a>
      </section>
      <div id="more"><LandingSections lang={lang} onDemo={onDemo} onStart={onStart} /></div>
        <footer className="footer">
          <div className="finner">
            <div className="brandrow">
              <svg className="mark abs" viewBox="0 0 100 100" aria-hidden>
                <path fill="#fff" d="M50 4a46 46 0 1 0 46 46h-14a32 32 0 1 1-32-32z" />
                <circle cx="80" cy="20" r="11" fill="#fff" />
              </svg>
              <span className="wordmark abs">GapLens</span>
            </div>
            <p className="tagline abs">{c.tagline}</p>
            <nav className="nav" aria-label="Footer">
              {c.cols.map((col, i) => (
                <div key={col.h} className={`col abs c${i + 1}`}>
                  <h3>{col.h}</h3>
                  <ul>
                    {col.items.map(([label, k]) => (
                      <li key={label}>
                        <a href={k === "repo" ? REPO : "#"} target={k === "repo" ? "_blank" : undefined} rel={k === "repo" ? "noreferrer" : undefined} onClick={act(k)} lang={k === "lang" ? (lang === "en" ? "hi" : "en") : undefined}>{label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            <div className="rule abs" />
            <div className="footrow">
              <p className="legal abs">{c.legal}</p>
              <div className="socials abs">
                <a href={REPO} target="_blank" rel="noreferrer" aria-label="GitHub">
                  <svg viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z" /></svg>
                </a>
                <a href={X_URL} target="_blank" rel="noreferrer" aria-label="X">
                  <svg viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M18.2 2.3h3.4l-7.4 8.4 8.7 11.5h-6.8l-5.3-7-6.1 7H1.3l7.9-9L.9 2.3h7l4.8 6.4zm-1.2 17.9h1.9L7.1 4.2H5.1z" /></svg>
                </a>
                <a href={INSTAGRAM} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" aria-hidden><path fill="none" stroke="currentColor" strokeWidth="2" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z" /><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.6" cy="6.4" r="1.3" fill="currentColor" /></svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
    </div>
  );
}
