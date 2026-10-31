"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Aspect, Fact, Lang, Report, Source } from "@/lib/types";
import { t } from "@/lib/i18n";
import { Roshni } from "./Roshni";
import { CoverageMap, EvidenceDrawer, Findings, Score, VerifyList } from "./Results";
import { toMarkdown } from "@/lib/report-md";

type Row = { key: string; url?: string; pasted?: { title: string; text: string }; state: "reading" | "ok" | "failed"; source?: Source; error?: string };
type View = "landing" | "work" | "running" | "results";

const DEMO_Q = "NSP post-matric scholarship 2026-27: who is eligible, what documents are needed, and how do I renew?";
const DEMO_URLS = [
  "https://scholarships.gov.in/",
  "https://righttoinformation.wiki/education/nsp-scholarship-renewal",
  "https://www.sarkariworld.com/nsp-scholarship-last-date-2026-27",
  "https://school.careers360.com/articles/post-matric-scholarship",
];
const EXAMPLES = [
  { label: "Scholarship renewal", q: DEMO_Q },
  { label: "College admission", q: "JEE Main 2027 eligibility: age limit, number of attempts, and class 12 marks needed?" },
  { label: "Exam rules", q: "CBSE class 10 board exam 2027: passing marks, compartment rules and re-evaluation fees?" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post<T>(path: string, body: unknown, onRate?: () => void): Promise<T> {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) { onRate?.(); await sleep(4000 * (i + 1)); continue; }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data as T;
  }
  throw new Error("rate_limited");
}

export default function GapLensApp() {
  const [lang, setLang] = useState<Lang>("en");
  const d = t(lang);
  const [view, setView] = useState<View>("landing");
  const [question, setQuestion] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pTitle, setPTitle] = useState(""); const [pText, setPText] = useState("");
  const [stage, setStage] = useState(0);
  const [stageInfo, setStageInfo] = useState("");
  const [rate, setRate] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [srcText, setSrcText] = useState<Record<string, Source>>({});
  const [openFact, setOpenFact] = useState<Fact | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const cache = useRef<{ aspects: Aspect[]; facts: Fact[]; key: string } | null>(null);
  const counter = useRef(0);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const readUrl = useCallback(async (url: string) => {
    const key = `r${++counter.current}`;
    setRows((r) => [...r, { key, url, state: "reading" }]);
    try {
      const { source } = await post<{ source: Source }>("/api/extract", { url, id: key });
      setRows((r) => r.map((x) => (x.key === key ? { ...x, state: "ok", source } : x)));
    } catch (e) {
      setRows((r) => r.map((x) => (x.key === key ? { ...x, state: "failed", error: e instanceof Error ? e.message : d.failed } : x)));
    }
  }, [d.failed]);

  const addUrl = () => {
    const u = urlInput.trim(); if (!u) return;
    const url = /^https?:\/\//.test(u) ? u : `https://${u}`;
    setUrlInput(""); if (rows.length < 6) readUrl(url);
  };
  const addPaste = async () => {
    if (pText.trim().split(/\s+/).length < 40) return;
    const key = `r${++counter.current}`;
    const { source } = await post<{ source: Source }>("/api/extract", { text: pText, title: pTitle, id: key });
    setRows((r) => [...r, { key, state: "ok", source, pasted: { title: pTitle, text: pText } }]);
    setPasteOpen(false); setPText(""); setPTitle("");
  };

  const ready = rows.filter((r) => r.state === "ok");
  const canRun = question.trim().length > 8 && ready.length >= 2 && !rows.some((r) => r.state === "reading");

  async function run(langOverride?: Lang) {
    const L = langOverride ?? lang;
    setError(""); setView("running"); setStage(1); setIsDemo(false);
    try {
      // re-number sources s1..sN so ids stay short
      const sources = ready.map((r, i) => ({ ...r.source!, id: `s${i + 1}` }));
      const key = question + "|" + sources.map((s) => s.url ?? s.title).join("|");
      setSrcText(Object.fromEntries(sources.map((s) => [s.id, s])));
      let aspects: Aspect[]; let facts: Fact[];
      if (cache.current?.key === key) ({ aspects, facts } = cache.current);
      else {
        setStage(2);
        ({ aspects } = await post<{ aspects: Aspect[] }>("/api/aspects", { question }, () => setRate(true)));
        setRate(false); setStageInfo(d.aspectsFound(aspects.length));
        setStage(3); facts = [];
        // two at a time, spread across model buckets
        for (let i = 0; i < sources.length; i += 2) {
          const batch = sources.slice(i, i + 2);
          const res = await Promise.all(batch.map((s, j) => post<{ facts: Fact[] }>("/api/evidence", { question, aspects, source: s, slot: i + j }, () => setRate(true)).catch(() => ({ facts: [] as Fact[] }))));
          res.forEach((r) => facts.push(...r.facts));
          setRate(false); setStageInfo(d.quotesFound(facts.filter((f) => f.verified).length));
        }
        cache.current = { aspects, facts, key };
      }
      setStage(4);
      const meta = sources.map((s) => { const m = { ...s } as Partial<Source>; delete m.text; return m; });
      const { report } = await post<{ report: Report }>("/api/synthesize", { question, lang: L, aspects, sources: meta, facts }, () => setRate(true));
      setRate(false); setReport(report); setView("results");
      try { localStorage.setItem("gaplens:last", JSON.stringify(report)); } catch {}
      window.scrollTo({ top: 0 });
    } catch (e) {
      setRate(false); setError(e instanceof Error && e.message !== "rate_limited" ? `${d.error} (${e.message})` : d.rate); setView("work");
    }
  }

  async function loadDemo() {
    setError("");
    const r = await fetch(`/demo/scholarship-${lang}.json`).then((x) => x.json());
    setQuestion(r.report.question); setReport(r.report);
    setSrcText(Object.fromEntries((r.sources as Source[]).map((s) => [s.id, s])));
    setRows((r.sources as Source[]).map((s) => ({ key: s.id, url: s.url, state: "ok" as const, source: s })));
    setIsDemo(true); setView("results"); window.scrollTo({ top: 0 });
  }

  async function switchLang() {
    const L: Lang = lang === "en" ? "hi" : "en";
    setLang(L);
    if (view === "results" && report) {
      if (isDemo) { const r = await fetch(`/demo/scholarship-${L}.json`).then((x) => x.json()); setReport(r.report); }
      else if (cache.current) run(L);
    }
  }

  function exportMd() {
    if (!report) return;
    const blob = new Blob([toMarkdown(report, d)], { type: "text/markdown" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "gaplens-report.md"; a.click();
  }

  const openCell = (aspectId: string, sourceId: string) => {
    const f = report?.facts.find((x) => x.aspectId === aspectId && x.sourceId === sourceId && x.verified);
    if (f) setOpenFact(f);
  };

  /* ------------------------------- render ------------------------------- */
  const header = (
    <header className="flex items-center justify-between py-6">
      <button onClick={() => setView("landing")} className="font-display text-[26px] font-bold tracking-tight">GapLens</button>
      <button onClick={switchLang} className={`text-[16px] text-fog hover:text-cream px-2 py-1 ${lang === "en" ? "hi" : ""}`} aria-label="Switch language">{d.lang}</button>
    </header>
  );

  if (view === "landing") {
    return (
      <main className="mx-auto max-w-[1180px] px-5 sm:px-8 pb-20">
        {header}
        <section className="grid lg:grid-cols-[1.25fr_1fr] gap-10 items-center pt-10 sm:pt-16">
          <div>
            <h1 className="font-display font-extrabold tracking-[-0.02em] leading-[0.98] text-[48px] sm:text-[72px] lg:text-[84px]">
              {d.hero1}<br />{d.hero2}
            </h1>
            <p className="mt-6 text-[18px] sm:text-[20px] text-cream/85 max-w-[38ch]">{d.sub}</p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <button onClick={loadDemo} className="bg-torch text-night font-semibold text-[17px] px-6 py-3.5 rounded-[12px] hover:bg-[#ffcd4a] active:translate-y-px">{d.demo}</button>
              <button onClick={() => setView("work")} className="text-[17px] underline underline-offset-[6px] decoration-torch decoration-2 hover:text-torch">{d.start}</button>
            </div>
          </div>
          <div className="relative hidden lg:flex justify-center">
            <Roshni mood="idle" size={190} />
          </div>
        </section>
        <section className="mt-20 sm:mt-28 border-t border-line pt-8 grid sm:grid-cols-[repeat(3,minmax(0,1fr))] gap-8 max-w-[1000px]">
          {[[d.l1t, d.l1, "bg-torch"], [d.l2t, d.l2, "border border-dashed border-torch"], [d.l3t, d.l3, "bg-torchdim/60 border border-torch/70"]].map(([h, p, sw]) => (
            <div key={h} className="flex gap-3">
              <span className={`mt-1.5 h-4 w-4 shrink-0 rounded ${sw}`} aria-hidden />
              <p className="text-[16px]"><span className="font-semibold">{h}.</span> <span className="text-fog">{p}</span></p>
            </div>
          ))}
        </section>
        <p className="mt-16 text-[14px] text-fog">{d.disclaimer}</p>
      </main>
    );
  }

  if (view === "work" || view === "running") {
    const running = view === "running";
    return (
      <main className="mx-auto max-w-[860px] px-5 sm:px-8 pb-20">
        {header}
        {running ? (
          <section className="pt-10 flex flex-col sm:flex-row gap-10 items-start" aria-live="polite">
            <Roshni mood="searching" size={120} />
            <div className="flex-1">
              <h2 className="font-display text-[32px] font-bold leading-tight">{question}</h2>
              <ol className="mt-8 space-y-4">
                {[d.stage1, d.stage2, d.stage3, d.stage4].map((s, i) => {
                  const n = i + 1; const st = stage > n ? "done" : stage === n ? "now" : "next";
                  return (
                    <li key={s} className={`flex items-center gap-4 text-[18px] ${st === "next" ? "text-fog/60" : ""}`}>
                      <span className={`h-7 w-7 rounded-full grid place-items-center text-[14px] font-semibold ${st === "done" ? "bg-torch text-night" : st === "now" ? "border-2 border-torch text-torch" : "border border-line"}`}>{st === "done" ? "✓" : n}</span>
                      <span>{s}{st === "now" && stageInfo && n >= 2 ? <span className="text-fog text-[15px] ml-3">{stageInfo}</span> : null}</span>
                    </li>
                  );
                })}
              </ol>
              {rate && <p className="mt-6 text-torch text-[15px]">{d.rate}</p>}
            </div>
          </section>
        ) : (
          <section className="pt-6">
            <label htmlFor="q" className="font-display text-[26px] font-bold">{d.question}</label>
            <textarea id="q" value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} placeholder={d.qph}
              className="mt-3 w-full bg-dusk border border-line rounded-[12px] p-4 text-[18px] placeholder:text-fog/70 focus:border-torch outline-none resize-y" />
            <div className="mt-3 flex flex-wrap gap-2 items-center text-[14px]">
              <span className="text-fog mr-1">{d.examples}:</span>
              {EXAMPLES.map((ex) => (
                <button key={ex.label} onClick={() => { setQuestion(ex.q); if (ex.q === DEMO_Q && rows.length === 0) DEMO_URLS.forEach(readUrl); }}
                  className="border border-line rounded-full px-3 py-1 hover:border-torch">{ex.label}</button>
              ))}
            </div>

            <div className="mt-10 flex items-baseline justify-between">
              <h2 className="font-display text-[26px] font-bold">{d.sources}</h2>
              <p className="text-fog text-[15px]">{d.srcHint}</p>
            </div>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {rows.map((r) => (
                <li key={r.key} className="py-3 flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full shrink-0 ${r.state === "ok" ? "bg-torch" : r.state === "reading" ? "border-2 border-torch animate-pulse" : "border border-fog"}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px]">{r.source?.title ?? r.url}</p>
                    <p className="text-[13px] text-fog">
                      {r.source?.site ?? (r.url ? new URL(r.url).hostname : "")}
                      {r.state === "reading" && `, ${d.reading}…`}
                      {r.state === "ok" && `, ${r.source!.words.toLocaleString()} ${d.read}`}
                      {r.state === "ok" && (r.source!.date ? `, ${r.source!.date}` : `, ${d.undated}`)}
                      {r.state === "failed" && <span className="text-cream">, {r.error}</span>}
                    </p>
                  </div>
                  {r.state === "failed" && <button onClick={() => setPasteOpen(true)} className="text-torch text-[14px] underline underline-offset-4">{d.paste}</button>}
                  <button onClick={() => setRows(rows.filter((x) => x.key !== r.key))} className="text-fog hover:text-cream px-2 text-[18px]" aria-label="Remove source">×</button>
                </li>
              ))}
              {rows.length === 0 && <li className="py-4 text-fog text-[15px]">{d.empty}</li>}
            </ul>
            {rows.length < 6 && (
              <form onSubmit={(e) => { e.preventDefault(); addUrl(); }} className="mt-4 flex flex-col sm:flex-row gap-3">
                <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder={d.urlph} inputMode="url" aria-label={d.urlph}
                  className="flex-1 bg-dusk border border-line rounded-[12px] px-4 py-3 text-[16px] focus:border-torch outline-none" />
                <button type="submit" className="border border-torch text-torch rounded-[12px] px-5 py-3 hover:bg-torch hover:text-night">{d.addSource}</button>
                <button type="button" onClick={() => setPasteOpen(!pasteOpen)} className="text-fog hover:text-cream underline underline-offset-4 px-2">{d.paste}</button>
              </form>
            )}
            {pasteOpen && (
              <div className="mt-4 bg-dusk border border-line rounded-[14px] p-4 space-y-3">
                <input value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder={d.pasteTitle} aria-label={d.pasteTitle} className="w-full bg-night border border-line rounded-[8px] px-3 py-2" />
                <textarea value={pText} onChange={(e) => setPText(e.target.value)} placeholder={d.pasteBody} aria-label={d.pasteBody} rows={6} className="w-full bg-night border border-line rounded-[8px] px-3 py-2" />
                <div className="flex gap-4"><button onClick={addPaste} className="bg-torch text-night rounded-[10px] px-4 py-2 font-semibold">{d.save}</button><button onClick={() => setPasteOpen(false)} className="text-fog">{d.cancel}</button></div>
              </div>
            )}
            {error && <p role="alert" className="mt-6 text-torch">{error}</p>}
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <button disabled={!canRun} onClick={() => run()} className="bg-torch text-night font-semibold text-[18px] px-7 py-4 rounded-[12px] disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#ffcd4a]">{d.analyse}</button>
              <button onClick={loadDemo} className="text-fog hover:text-cream underline underline-offset-4">{d.demo}</button>
            </div>
          </section>
        )}
      </main>
    );
  }

  // results
  const r = report!;
  return (
    <main className="mx-auto max-w-[1180px] px-5 sm:px-8 pb-24">
      {header}
      <section className="pt-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="font-display text-[28px] sm:text-[36px] font-bold leading-tight max-w-[30ch]">{r.question}</h1>
          <div className="flex gap-4 text-[15px]">
            <button onClick={exportMd} className="text-fog hover:text-cream underline underline-offset-4">{d.export}</button>
            <button onClick={() => { setReport(null); setRows([]); setQuestion(""); cache.current = null; setView("work"); }} className="text-fog hover:text-cream underline underline-offset-4">{d.newRun}</button>
          </div>
        </div>
        {isDemo && <p className="text-[14px] text-fog mt-2">{d.demoNote}</p>}
        <div className="mt-8 flex flex-col lg:flex-row lg:items-end gap-6 justify-between border-b border-line pb-8">
          <Score value={r.coverage} d={d} report={r} />
          {r.summary && <p className="text-[18px] text-cream/90 max-w-[56ch] lg:pb-2">{r.summary}</p>}
        </div>
      </section>

      <section className="mt-10 grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-12">
        <div className="space-y-12 order-2 lg:order-1">
          <div className="bg-dusk rounded-[14px] p-5 sm:p-6">
            <h2 className="font-display text-[22px] font-bold mb-4">{d.map}</h2>
            <CoverageMap report={r} d={d} onOpen={openCell} />
          </div>
          <Findings report={r} d={d} onQuote={setOpenFact} />
        </div>
        <aside className="order-1 lg:order-2">
          <h2 className="font-display text-[26px] font-bold mb-5">{d.verify}</h2>
          <VerifyList report={r} d={d} />
          <p className="mt-10 text-[14px] text-fog">{d.disclaimer}</p>
        </aside>
      </section>
      <EvidenceDrawer fact={openFact} source={openFact ? srcText[openFact.sourceId] : undefined} d={d} onClose={() => setOpenFact(null)} />
    </main>
  );
}
