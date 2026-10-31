"use client";
// avoid-ai-design-ignore: SD5 (the boxed headline lines are the requested Nova-style framing, each whole line is boxed)
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/types";
import "./landing.css";

const COPY = {
  en: {
    bar: "Built for Shinchan Hackathon 2026. Try the scholarship demo",
    menu: ["How it works", "Use cases", "GitHub"], pad: "Demo", launch: "Start analysis", lang: "हिंदी",
    rail: ["Intro", "Product", "Use cases"], top: "Top",
    prompts: [
      "NSP post-matric scholarship 2026-27: who is eligible, what documents are needed, and how do I renew?",
      "JEE Main 2027: age limit, number of attempts, and class 12 marks needed?",
      "CBSE class 10 board exam 2027: passing marks, compartment rules and re-evaluation fees?",
      "PM Kisan eKYC: last date, documents, and what happens if I miss it?",
    ],
    feats: ["Confirmed facts", "Dark spots", "Conflicts", "And what to verify next"],
    kicker: "Before you act on five tabs of answers",
    h1: "Find the gaps", h2: "in your sources",
    sub: "Add a question and a few links. GapLens shows what's confirmed, what's missing and what disagrees, with the exact quote behind each finding.",
    scroll: "Scroll",
    tabs: ["Exact quotes", "Coverage map", "Dark spots", "Conflicts side by side", "Outdated and undated pages", "Verify next checklist", "Hindi output", "Markdown export", "Paste-text fallback", "Exact quotes"],
    p1: "Every finding", p2: "keeps its quote",
    how: ["Read each page on the server", "List what a full answer needs", "Pull quotes, checked word for word", "Score only verified facts"],
    caseLabel: "Use case",
    cases: [
      { who: "First-generation student", role: "Renewing an NSP scholarship", q: "Four pages, four answers on the income limit. Which one do I trust before I submit?", found: "In the demo GapLens put ₹3.5 lakh and ₹2.5 lakh side by side, with both quotes" },
      { who: "Parent of a class 10 student", role: "Checking re-evaluation rules", q: "The fee and the deadline are on one site only. Is that enough to plan around?", found: "Facts with a single source are marked, so you know what still needs the official notice" },
      { who: "NGO volunteer", role: "Helping families apply for schemes", q: "I need a short list of what to confirm at the office, not another summary.", found: "Verify next ranks each open question by how much it matters, in English or Hindi" },
    ],
    tryIt: "Try the scholarship demo", foot: "GapLens, built in 2026",
  },
  hi: {
    bar: "Shinchan Hackathon 2026 के लिए बनाया गया। स्कॉलरशिप डेमो देखें",
    menu: ["कैसे काम करता है", "किसके लिए", "GitHub"], pad: "डेमो", launch: "विश्लेषण शुरू करें", lang: "English",
    rail: ["शुरुआत", "प्रोडक्ट", "किसके लिए"], top: "ऊपर",
    prompts: [
      "NSP पोस्ट-मैट्रिक स्कॉलरशिप 2026-27: कौन पात्र है, कौन से दस्तावेज़ चाहिए, और रिन्यू कैसे करें?",
      "JEE Main 2027: उम्र सीमा, कितने प्रयास, और 12वीं में कितने अंक चाहिए?",
      "CBSE 10वीं बोर्ड 2027: पास अंक, कंपार्टमेंट नियम और री-इवैल्यूएशन फीस?",
      "PM किसान eKYC: आख़िरी तारीख़, दस्तावेज़, और चूक गए तो क्या होगा?",
    ],
    feats: ["पक्की जानकारी", "अंधेरे कोने", "टकराव", "और आगे क्या जाँचें"],
    kicker: "पाँच टैब के जवाबों पर भरोसा करने से पहले",
    h1: "अपने स्रोतों की", h2: "कमियाँ खोजें",
    sub: "एक सवाल और कुछ लिंक जोड़िए। GapLens बताता है क्या पक्का है, क्या छूटा है और कहाँ स्रोत असहमत हैं, हर बात के साथ असली उद्धरण।",
    scroll: "नीचे",
    tabs: ["असली उद्धरण", "कवरेज नक्शा", "अंधेरे कोने", "टकराव आमने-सामने", "पुराने और बिना तारीख़ के पेज", "आगे यह जाँचें", "हिंदी में नतीजे", "Markdown डाउनलोड", "टेक्स्ट पेस्ट करें", "असली उद्धरण"],
    p1: "हर नतीजा", p2: "अपने उद्धरण के साथ",
    how: ["हर पेज सर्वर पर पढ़ा जाता है", "पूरे जवाब की ज़रूरी बातें", "उद्धरण, शब्द-दर-शब्द जाँचे गए", "स्कोर सिर्फ़ जाँचे गए तथ्यों से"],
    caseLabel: "उदाहरण",
    cases: [
      { who: "पहली पीढ़ी का छात्र", role: "NSP स्कॉलरशिप रिन्यू कर रहा है", q: "चार पेज, आय सीमा पर चार जवाब। जमा करने से पहले किस पर भरोसा करूँ?", found: "डेमो में GapLens ने ₹3.5 लाख और ₹2.5 लाख दोनों उद्धरण आमने-सामने रखे" },
      { who: "10वीं के छात्र के माता-पिता", role: "री-इवैल्यूएशन नियम देख रहे हैं", q: "फीस और तारीख़ सिर्फ़ एक साइट पर है। क्या उस पर योजना बनाना ठीक है?", found: "एक ही स्रोत वाली बातें अलग दिखती हैं, ताकि पता रहे क्या आधिकारिक सूचना से जाँचना है" },
      { who: "NGO स्वयंसेवक", role: "परिवारों को योजनाओं में मदद", q: "मुझे दफ़्तर में पूछने के लिए छोटी सूची चाहिए, एक और सारांश नहीं।", found: "आगे क्या जाँचें, हर सवाल को अहमियत के हिसाब से, हिंदी या अंग्रेज़ी में" },
    ],
    tryIt: "स्कॉलरशिप डेमो देखें", foot: "GapLens, built in 2026",
  },
} as const;

const REPO = "https://github.com/abhi478jeetur-rgb/gaplens";

function Brackets() {
  return (<><i className="br tl" /><i className="br tr" /><i className="br bl" /><i className="br bm" /></>);
}

function Avatar() {
  return (
    <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden>
      <rect width="56" height="56" fill="#1A2332" />
      {[0, 1, 2, 3, 4, 5].map((r) => [0, 1, 2, 3].map((c) => (
        <rect key={`${r}-${c}`} x={(r % 2 ? -7 : 0) + c * 15 + 1} y={r * 9 + 1} width="13" height="7" fill="none" stroke="#2C384E" strokeWidth="1" />
      )))}
      <circle cx="28" cy="22" r="8" fill="#94A3B8" />
      <path d="M12 56c2-12 9-18 16-18s14 6 16 18z" fill="#94A3B8" />
    </svg>
  );
}

export default function Landing({ lang, onLang, onDemo, onStart }: { lang: Lang; onLang: () => void; onDemo: () => void; onStart: () => void }) {
  const c = COPY[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [barGone, setBarGone] = useState(false);
  const [sec, setSec] = useState(0);
  const [typed, setTyped] = useState("");
  const [pi, setPi] = useState(0);
  const [tab, setTab] = useState(0);
  const [rv, setRv] = useState(0);
  const [fading, setFading] = useState(false);
  const [noAnim, setNoAnim] = useState(false);
  const [noGl, setNoGl] = useState(false);
  const secRefs = useRef<(HTMLElement | null)[]>([]);

  // three.js robot
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dispose: (() => void) | undefined; let alive = true;
    const fail = () => { if (alive) setNoGl(true); };
    const probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) { fail(); return; }
    import("./robot").then(({ mountRobot }) => { try { if (alive && canvasRef.current) dispose = mountRobot(canvasRef.current, { reduced }); } catch { fail(); } }).catch(fail);
    return () => { alive = false; dispose?.(); };
  }, []);

  // chrome on scroll + section label + reveal
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }), { threshold: 0.15 });
    const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.intersectionRatio > 0.5) setSec(Number((e.target as HTMLElement).dataset.i)); }), { threshold: [0.5, 0.51] });
    secRefs.current.forEach((s) => { if (s) { io.observe(s); io2.observe(s); } });
    return () => { window.removeEventListener("scroll", onScroll); io.disconnect(); io2.disconnect(); };
  }, []);

  // typing prompt
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const list = c.prompts;
    if (reduced) { setTyped(list[0]); return; }
    let i = 0, ch = 0, phase: "type" | "hold" | "del" | "wait" = "type"; let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const p = list[i];
      if (phase === "type") { ch++; setTyped(p.slice(0, ch)); if (ch >= p.length) { phase = "hold"; timer = setTimeout(step, 2600); return; } timer = setTimeout(step, 38); }
      else if (phase === "hold") { phase = "del"; timer = setTimeout(step, 14); }
      else if (phase === "del") { ch = Math.max(0, ch - 2); setTyped(p.slice(0, ch)); if (ch === 0) { phase = "wait"; timer = setTimeout(step, 250); return; } timer = setTimeout(step, 14); }
      else { i = (i + 1) % list.length; setPi(i); phase = "type"; timer = setTimeout(step, 38); }
    };
    setPi(0); timer = setTimeout(step, 600);
    return () => clearTimeout(timer);
  }, [c.prompts]);

  // tab carousel
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setTab((t) => t + 1), 2400);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (tab === 9) { const id = setTimeout(() => { setNoAnim(true); setTab(0); requestAnimationFrame(() => requestAnimationFrame(() => setNoAnim(false))); }, 950); return () => clearTimeout(id); }
  }, [tab]);

  const swap = (d: number) => { setFading(true); setTimeout(() => { setRv((v) => (v + d + 3) % 3); setFading(false); }, 450); };
  const go = (i: number) => secRefs.current[i]?.scrollIntoView({ behavior: "smooth" });
  const cur = c.cases[rv]; const ghost = c.cases[(rv + 1) % 3];

  return (
    <div className={`nv ${lang === "hi" ? "hi" : ""}`}>
      <canvas ref={canvasRef} className="nv-canvas" aria-hidden />
      {noGl && (
        <svg className="nv-fallback" viewBox="0 0 240 300" aria-hidden>
          <rect x="40" y="20" width="160" height="150" rx="26" fill="#E8E4DC" />
          <rect x="62" y="44" width="116" height="100" rx="18" fill="#0B1020" stroke="#FBBF24" strokeWidth="4" />
          <ellipse cx="100" cy="94" rx="10" ry="13" fill="#F1FAEE" />
          <ellipse cx="140" cy="90" rx="10" ry="13" fill="#F1FAEE" />
          <rect x="108" y="170" width="24" height="14" fill="#1B2233" />
          <rect x="64" y="184" width="112" height="96" rx="22" fill="#E8E4DC" />
          <circle cx="104" cy="214" r="4" fill="#FBBF24" /><circle cx="120" cy="214" r="4" fill="#FBBF24" opacity=".6" /><circle cx="136" cy="214" r="4" fill="#FBBF24" opacity=".3" />
          <rect x="176" y="200" width="40" height="18" rx="9" fill="#E8E4DC" />
          <rect x="212" y="192" width="12" height="34" rx="3" fill="#1B2233" />
          <path d="M224 196 L238 186 L238 232 L224 222 Z" fill="#FBBF24" />
        </svg>
      )}
      <div className="nv-guides" aria-hidden><span /><span /><span /></div>

      <div className={`nv-bar ${scrolled || barGone ? "gone" : ""}`}>
        <button onClick={onDemo}>{c.bar}</button>
        <button className="x" onClick={() => setBarGone(true)} aria-label="Close">×</button>
      </div>

      <nav className={`nv-nav ${scrolled || barGone ? "up" : ""}`}>
        <a className="nv-logo" href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <svg width="27" height="27" viewBox="0 0 27 27" aria-hidden><path d="M21 3.5H8A4.5 4.5 0 0 0 3.5 8v11A4.5 4.5 0 0 0 8 23.5h13" fill="none" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" /><circle cx="10.5" cy="12.5" r="1.7" fill="#F1FAEE" /><circle cx="16.5" cy="12.5" r="1.7" fill="#F1FAEE" /></svg>
          <span>GapLens</span>
        </a>
        <div className="nv-menu">
          <button onClick={() => go(1)}>{c.menu[0]}</button>
          <button onClick={() => go(2)}>{c.menu[1]}</button>
          <a href={REPO} target="_blank" rel="noreferrer">{c.menu[2]}</a>
          <button onClick={onLang} className={lang === "en" ? "hi" : ""}>{c.lang}</button>
        </div>
        <button className="nv-pad" onClick={onDemo}>{c.pad}</button>
        <div className="nv-cta-cell"><button className="nv-launch" onClick={onStart}><b aria-hidden>••</b>{c.launch}</button></div>
      </nav>

      <aside className="nv-rail" aria-hidden>
        <div className="dots">{Array.from({ length: 14 }).map((_, i) => <i key={i} />)}</div>
        <div className="lbl" style={{ top: `${[0, 31, 62][sec]}%` }}>
          <svg width="11" height="11" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" /><path d="M6 6 9 3.5" stroke="currentColor" /></svg>{c.rail[sec]}
        </div>
        <button className="menu" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>≡ {c.top}</button>
      </aside>

      {/* 1. intro */}
      <section className="nv-sec nv-intro" data-i="0" ref={(el) => { secRefs.current[0] = el; }}>
        <div className="nv-prompt rv">
          <div className="tab" aria-hidden>?</div>
          <div className="box"><Brackets /><span>{typed}</span><i className="caret" /></div>
          <p className="next">{c.prompts[(pi + 1) % c.prompts.length]}</p>
        </div>
        <div className="nv-rule rv" />
        <ul className="nv-feats rv">{c.feats.map((f, i) => <li key={f} className={i === 3 ? "dim" : ""}><i />{f}</li>)}</ul>
        <div className="nv-head rv">
          <p className="kicker">{c.kicker}</p>
          <h1><span className="b1"><span>{c.h1}</span></span><br /><span className="b2">{c.h2}</span></h1>
        </div>
        <p className="nv-sub rv">{c.sub}</p>
        <button className="nv-scroll rv" onClick={() => go(1)}><Brackets />{c.scroll}<svg width="10" height="12" viewBox="0 0 10 12" aria-hidden><path d="M5 1v9M1 6.5 5 10.5 9 6.5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg></button>
        <div className="nv-bottomrule" aria-hidden />
      </section>

      {/* 2. product */}
      <section className="nv-sec nv-product" data-i="1" ref={(el) => { secRefs.current[1] = el; }}>
        <div className="nv-tabs rv">
          <div className="strip" style={{ transform: `translateX(calc(${-tab} * var(--tabw)))`, transition: noAnim ? "none" : undefined }}>
            {c.tabs.map((t, i) => (
              <div key={i} className={`t ${i === tab ? "on" : i < tab ? "past" : ""}`}>
                {i === tab && <Brackets />}<span className="n">{String(i === 9 ? 1 : i + 1).padStart(2, "0")}</span><span className="l">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <ul className="nv-how rv">{c.how.map((h, i) => <li key={h}><span className="n">{i + 1}</span>{h}</li>)}</ul>
        <div className="nv-gate rv">
          <p className="dd" aria-hidden>··</p>
          <h2><span className="o">{c.p1}</span><br />{c.p2}</h2>
          <div className="acts">
            <button className="nv-primary" onClick={onDemo}>{c.tryIt}</button>
            <button className="nv-link" onClick={onStart}>{c.launch}</button>
          </div>
        </div>
      </section>

      {/* 3. use cases */}
      <section className="nv-sec nv-reviews" data-i="2" ref={(el) => { secRefs.current[2] = el; }}>
        <div className="nv-strip rv">
          <span className="tag">{c.caseLabel} <span className="num">0{rv + 1}</span></span>
          <div className={`who ${fading ? "fade" : ""}`}><Avatar /><i className="dot" /><span className="name">{cur.who}</span><span className="role">{cur.role}</span></div>
        </div>
        <div className={`nv-quote rv ${fading ? "fade" : ""}`}>
          <blockquote>&ldquo;{cur.q}</blockquote>
          <p className="found">{cur.found}</p>
          <button className="try" onClick={onDemo}>{c.tryIt}</button>
        </div>
        <div className="nv-arrows rv">
          <button onClick={() => swap(-1)} aria-label="Previous">←</button>
          <button onClick={() => swap(1)} aria-label="Next">→</button>
        </div>
        <blockquote className="nv-ghost" aria-hidden>&ldquo;{ghost.q}</blockquote>
      </section>
      <footer className="nv-foot">{c.foot}</footer>
    </div>
  );
}
