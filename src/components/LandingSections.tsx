"use client";
// Sections between the hero and the footer. Word-by-word statement over a fixed ember video,
// cursor ink reveal, animated steps, features and who it is for.
import { motion, useScroll, useSpring } from "framer-motion";
import { useRef, type CSSProperties, type ReactNode } from "react";
import type { Lang } from "@/lib/types";
import InkReveal from "./InkReveal";

const EASE = [0.22, 1, 0.36, 1] as const;

type FadeUpProps = { children: ReactNode; delay?: number; duration?: number; y?: number; className?: string; style?: CSSProperties; as?: "div" | "span" | "h2" | "h3" | "p" | "li"; once?: boolean };
export function FadeUp({ children, delay = 0, duration = 0.7, y = 24, className, style, as = "div", once = true }: FadeUpProps) {
  const Tag = motion[as];
  return (
    <Tag className={className} style={style} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }} transition={{ duration, delay, ease: EASE }}>
      {children}
    </Tag>
  );
}

const C = {
  en: {
    statement: "We find the gaps your sources leave behind.",
    statementSub: "One question, a few links, and a clear map of what's confirmed, missing, conflicting or out of date.",
    inkWord: "DARK SPOTS",
    inkTop: "Five tabs of answers, and the one fact you need is hiding between them.",
    inkCta: "Try the demo",
    inkHint: "Move your cursor",
    inkAside: ["Gaps", "Conflicts", "Old pages"],
    stepsKicker: "How it works",
    stepsTitle: "From five tabs to one clear answer",
    steps: [
      ["Ask and add links", "Type one question and paste 2 to 6 links, or paste text when a page blocks reading. Many links at once is fine."],
      ["AI plans the full answer", "GapLens lists every fact a complete answer needs: who's eligible, the documents, the deadlines, the amounts."],
      ["Every fact gets a real quote", "Each source is read and every fact is matched to an exact sentence from the page. Paraphrases are marked unverified."],
      ["See what's missing", "A coverage map, dark spots, conflicts side by side, outdated pages and a ranked checklist of what to verify next."],
    ],
    featKicker: "What you get",
    featTitle: "Built so you can trust what you read",
    feats: [
      ["Exact quotes", "Tap any finding to see the sentence it came from, highlighted on the original page."],
      ["Coverage map", "Every part of the answer against every source, so blind spots jump out."],
      ["Conflicts side by side", "When one site says ₹3.5 lakh and another says ₹2.5 lakh, you see both."],
      ["Outdated pages flagged", "Old or undated sources are marked, so last year's rules don't fool you."],
      ["English and Hindi", "The whole report switches language in one tap."],
      ["Share and save", "Copy the checklist, send it on WhatsApp, save as PDF or Markdown."],
    ],
    whoKicker: "Who it's for",
    whoTitle: "For anyone who can't afford to get it wrong",
    who: [
      ["Students and families", "Scholarships, admissions and exam notices, checked before the deadline."],
      ["Teachers and counsellors", "Hand students a verified checklist instead of a pile of links."],
      ["Journalists and researchers", "See where coverage is thin and where sources disagree."],
    ],
    finalTitle: "Check before you trust.",
    finalSub: "Free, no sign-up, works on your phone.",
    demo: "Try the demo",
    start: "Ask your own question",
  },
  hi: {
    statement: "हम वो कमियाँ ढूँढते हैं जो आपके स्रोत छोड़ जाते हैं।",
    statementSub: "एक सवाल, कुछ लिंक, और साफ़ नक्शा कि क्या पक्का है, क्या गायब है, कहाँ टकराव है और क्या पुराना है।",
    inkWord: "अंधेरे कोने",
    inkTop: "पाँच टैब में जवाब, और जो बात आपको चाहिए वो उनके बीच छुपी है।",
    inkCta: "डेमो देखिए",
    inkHint: "कर्सर घुमाइए",
    inkAside: ["कमियाँ", "टकराव", "पुराने पेज"],
    stepsKicker: "कैसे काम करता है",
    stepsTitle: "पाँच टैब से एक साफ़ जवाब तक",
    steps: [
      ["सवाल पूछें, लिंक जोड़ें", "एक सवाल लिखें और 2 से 6 लिंक डालें, या पेज न खुले तो टेक्स्ट पेस्ट करें। एक साथ कई लिंक भी चलेंगे।"],
      ["AI पूरा जवाब प्लान करता है", "GapLens बताता है कि पूरे जवाब में क्या-क्या होना चाहिए: पात्रता, दस्तावेज़, तारीखें, रकम।"],
      ["हर बात का असली उद्धरण", "हर स्रोत पढ़ा जाता है और हर बात पेज के असली वाक्य से मिलाई जाती है। अपने शब्दों वाली बात अपुष्ट मानी जाती है।"],
      ["देखें क्या गायब है", "कवरेज नक्शा, अंधेरे कोने, आमने-सामने टकराव, पुराने पेज और आगे क्या जाँचें इसकी सूची।"],
    ],
    featKicker: "आपको क्या मिलता है",
    featTitle: "ताकि आप पढ़ी हुई बात पर भरोसा कर सकें",
    feats: [
      ["असली उद्धरण", "किसी भी बात पर टैप करें और मूल पेज पर वो वाक्य हाइलाइट देखें।"],
      ["कवरेज नक्शा", "जवाब का हर हिस्सा, हर स्रोत के सामने, ताकि कमी तुरंत दिखे।"],
      ["आमने-सामने टकराव", "एक साइट ₹3.5 लाख कहे और दूसरी ₹2.5 लाख, तो दोनों दिखते हैं।"],
      ["पुराने पेज चिह्नित", "पुराने या बिना तारीख वाले स्रोत अलग दिखते हैं।"],
      ["हिंदी और अंग्रेज़ी", "पूरी रिपोर्ट एक टैप में भाषा बदलती है।"],
      ["शेयर और सेव", "चेकलिस्ट कॉपी करें, WhatsApp पर भेजें, PDF या Markdown में सेव करें।"],
    ],
    whoKicker: "किसके लिए",
    whoTitle: "उनके लिए जिनसे गलती नहीं हो सकती",
    who: [
      ["छात्र और परिवार", "स्कॉलरशिप, एडमिशन और परीक्षा की सूचना, आखिरी तारीख से पहले जाँची हुई।"],
      ["शिक्षक और काउंसलर", "लिंक के ढेर की जगह जाँची हुई चेकलिस्ट दें।"],
      ["पत्रकार और शोधकर्ता", "देखें कहाँ जानकारी कम है और कहाँ स्रोत असहमत हैं।"],
    ],
    finalTitle: "भरोसे से पहले जाँचिए।",
    finalSub: "मुफ़्त, बिना साइन-अप, फ़ोन पर भी।",
    demo: "डेमो देखिए",
    start: "अपना सवाल पूछिए",
  },
};

function Statement({ text, sub }: { text: string; sub: string }) {
  const words = text.split(" ");
  return (
    <section className="ls-statement">
      <div className="ls-statement-in">
        <h2>{words.map((w, i) => (
          <motion.span key={i} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: EASE }}>{w}</motion.span>
        ))}</h2>
        <FadeUp as="p" delay={0.9}>{sub}</FadeUp>
      </div>
    </section>
  );
}

function Steps({ kicker, title, steps }: { kicker: string; title: string; steps: string[][] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return (
    <section className="ls-sec ls-steps">
      <FadeUp as="p" className="ls-kicker">{kicker}</FadeUp>
      <FadeUp as="h2" className="ls-title" delay={0.08}>{title}</FadeUp>
      <div className="ls-steps-wrap">
      <div className="ls-rail" aria-hidden><motion.div className="ls-rail-fill" style={{ scaleY }} /></div>
      <ol ref={ref}>
        {steps.map(([h, p], i) => (
          <motion.li key={h} initial="off" whileInView="on" viewport={{ once: false, amount: 0.6 }}>
            <motion.span className="ls-num" variants={{ off: { scale: 0.85, backgroundColor: "rgba(255,255,255,0.06)", color: "#ffffff" }, on: { scale: 1, backgroundColor: "#ffffff", color: "#000000" } }} transition={{ duration: 0.45, ease: EASE }}>{i + 1}</motion.span>
            <motion.div className="ls-step" variants={{ off: { opacity: 0.35, x: 18 }, on: { opacity: 1, x: 0 } }} transition={{ duration: 0.6, ease: EASE }}>
              <h3>{h}</h3>
              <p>{p}</p>
              <StepArt i={i} />
            </motion.div>
          </motion.li>
        ))}
      </ol>
      </div>
    </section>
  );
}

function StepArt({ i }: { i: number }) {
  if (i === 0) return <div className="art art-links" aria-hidden>{["scholarships.gov.in", "sarkariworld.com", "careers360.com"].map((u, k) => <motion.span key={u} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + k * 0.15, ease: EASE }}>{u}</motion.span>)}</div>;
  if (i === 1) return <div className="art art-plan" aria-hidden>{["Eligibility", "Documents", "Deadline", "Income limit", "Renewal"].map((u, k) => <motion.span key={u} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.15 + k * 0.1, ease: EASE }}>{u}</motion.span>)}</div>;
  if (i === 2) return <div className="art art-quote" aria-hidden><span>“Family income up to </span><motion.mark initial={{ backgroundSize: "0% 100%" }} whileInView={{ backgroundSize: "100% 100%" }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.8, ease: EASE }}>₹2.5 lakh per annum</motion.mark><span>”</span><em>✓ verified</em></div>;
  const cells = ["c", "c", "p", "n", "x", "c", "n", "c", "p", "n", "c", "x"];
  return <div className="art art-map" aria-hidden>{cells.map((v, k) => <motion.i key={k} className={`m-${v}`} initial={{ opacity: 0.05 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 + k * 0.06 }} />)}</div>;
}

const ICONS = [
  "M4 5h16v11H8l-4 4z", "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z", "M7 4v16M17 4v16M3 8h8M13 16h8",
  "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M4 6h10M9 4v2M6 6c0 4 3 7 7 8M12 6c-1 4-4 7-7 8M14 20l4-9 4 9M15.5 17h5", "M12 3v12M7 10l5 5 5-5M5 21h14",
];

export default function LandingSections({ lang, onDemo, onStart }: { lang: Lang; onDemo: () => void; onStart: () => void }) {
  const c = C[lang];
  return (
    <div className="ls">
      <div className="ls-bg" aria-hidden>
        <video autoPlay muted loop playsInline poster="/ember.jpg">
          <source src="/ember.webm" type="video/webm" />
          <source src="/ember.mp4" type="video/mp4" />
        </video>
        <div className="ls-scrim" />
      </div>
      <Statement text={c.statement} sub={c.statementSub} />
      <InkReveal word={c.inkWord} top={c.inkTop} cta={c.inkCta} onCta={onDemo} hint={c.inkHint} aside={c.inkAside} />
      <Steps kicker={c.stepsKicker} title={c.stepsTitle} steps={c.steps} />
      <section className="ls-sec">
        <FadeUp as="p" className="ls-kicker">{c.featKicker}</FadeUp>
        <FadeUp as="h2" className="ls-title" delay={0.08}>{c.featTitle}</FadeUp>
        <div className="ls-grid">
          {c.feats.map(([h, p], i) => (
            <FadeUp key={h} className="ls-card" delay={0.1 + (i % 3) * 0.08}>
              <svg viewBox="0 0 24 24" aria-hidden><path d={ICONS[i]} /></svg>
              <h3>{h}</h3>
              <p>{p}</p>
            </FadeUp>
          ))}
        </div>
      </section>
      <section className="ls-sec">
        <FadeUp as="p" className="ls-kicker">{c.whoKicker}</FadeUp>
        <FadeUp as="h2" className="ls-title" delay={0.08}>{c.whoTitle}</FadeUp>
        <div className="ls-who">
          {c.who.map(([h, p], i) => (
            <FadeUp key={h} delay={0.1 + i * 0.1} className="ls-who-item">
              <span className="ls-who-n">0{i + 1}</span>
              <h3>{h}</h3>
              <p>{p}</p>
            </FadeUp>
          ))}
        </div>
        <FadeUp className="ls-final" delay={0.1}>
          <h2>{c.finalTitle}</h2>
          <p>{c.finalSub}</p>
          <div className="ls-final-ctas">
            <button className="ls-btn" onClick={onDemo}>{c.demo}</button>
            <button className="ls-link" onClick={onStart}>{c.start} <span aria-hidden>→</span></button>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}
