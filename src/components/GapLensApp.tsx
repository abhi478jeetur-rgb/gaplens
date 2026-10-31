"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Aspect, Fact, Lang, Report, Source } from "@/lib/types";
import { t } from "@/lib/i18n";
import { Roshni } from "./Roshni";
import Landing from "./Landing";
import { CoverageMap, EvidenceDrawer, Findings, Score, VerifyList } from "./Results";
import { toMarkdown, toChecklist } from "@/lib/report-md";

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

type HistItem = { report: Report; sources: Source[] };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post<T>(path: string, body: unknown, onRate?: () => void): Promise<T> {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) {
      if (data.error === "busy" && i >= 1) throw new Error("busy");
      onRate?.(); await sleep(Math.min(15, Number(res.headers.get("retry-after") ?? 0) || 4 * (i + 1)) * 1000); continue;
    }
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
  const [history, setHistory] = useState<HistItem[]>([]);
  const [copied, setCopied] = useState(false);
  useEffect(() => { try { setHistory(JSON.parse(localStorage.getItem("gaplens:history") || "[]")); } catch {} }, []);
  const remember = (report: Report, sources: Source[]) => {
    const item: HistItem = { report, sources: sources.map((s) => ({ ...s, text: s.text.slice(0, 20000) })) };
    setHistory((h) => {
      const next = [item, ...h.filter((x) => x.report.question !== report.question)].slice(0, 5);
      try { localStorage.setItem("gaplens:history", JSON.stringify(next)); } catch { try { localStorage.setItem("gaplens:history", JSON.stringify(next.slice(0, 2))); } catch {} }
      return next;
    });
  };
  const openHistory = (h: HistItem) => {
    setQuestion(h.report.question); setReport(h.report); setLang(h.report.lang);
    setSrcText(Object.fromEntries(h.sources.map((s) => [s.id, s])));
    setRows(h.sources.map((s) => ({ key: s.id, url: s.url, state: "ok" as const, source: s })));
    cache.current = null; setIsDemo(false); setView("results"); window.scrollTo({ top: 0 });
  };
  const copyChecklist = async () => {
    if (!report) return;
    try { await navigator.clipboard.writeText(toChecklist(report, d)); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };
  const cache = useRef<{ aspects: Aspect[]; facts: Fact[]; key: string } | null>(null);
  const counter = useRef(0);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  // Keep the open report across refresh, print preview and back/forward (this tab only).
  const SAVE = "gaplens:current";
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SAVE);
      if (!raw) return;
      const c = JSON.parse(raw) as { report: Report; sources: Source[]; demo: boolean; lang: Lang };
      setQuestion(c.report.question); setReport(c.report); setLang(c.lang ?? c.report.lang); setIsDemo(!!c.demo);
      setSrcText(Object.fromEntries(c.sources.map((x) => [x.id, x])));
      setRows(c.sources.map((x) => ({ key: x.id, url: x.url, state: "ok" as const, source: x })));
      setView("results");
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (view === "results" && report) {
        const sources = Object.values(srcText).map((x) => ({ ...x, text: x.text.slice(0, 20000) }));
        sessionStorage.setItem(SAVE, JSON.stringify({ report, sources, demo: isDemo, lang }));
      } else if (view === "landing" || view === "work") sessionStorage.removeItem(SAVE);
    } catch {}
  }, [view, report, srcText, isDemo, lang]);

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
    const parts = urlInput.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);
    if (!parts.length) return;
    const have = new Set(rows.map((r) => r.url));
    let room = 6 - rows.length;
    for (const u of parts) {
      if (room <= 0) break;
      const url = /^https?:\/\//.test(u) ? u : `https://${u}`;
      if (have.has(url)) continue; have.add(url); room--; readUrl(url);
    }
    setUrlInput("");
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
      remember(report, sources);
      window.scrollTo({ top: 0 });
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setRate(false); setError(m === "busy" ? d.busy : m && m !== "rate_limited" ? `${d.error} (${m})` : d.rate); setView("work");
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
      else if (rows.some((x) => x.state === "ok")) run(L);
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
      <button onClick={() => setView("landing")} className="flex items-center gap-3 text-[22px] tracking-[.01em]"><svg viewBox="0 0 100 100" className="h-6 w-6" aria-hidden><path fill="#fff" d="M50 4a46 46 0 1 0 46 46h-14a32 32 0 1 1-32-32z" /><circle cx="80" cy="20" r="11" fill="#fff" /></svg>GapLens</button>
      <button onClick={switchLang} className={`text-[16px] text-fog hover:text-cream px-2 py-1 ${lang === "en" ? "hi" : ""}`} aria-label="Switch language">{d.lang}</button>
    </header>
  );

  if (view === "landing") {
    return <Landing lang={lang} onLang={switchLang} onDemo={loadDemo} onStart={() => { setView("work"); window.scrollTo({ top: 0 }); }} />;
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
              <h2 className="font-display text-[32px] font-medium leading-tight">{question}</h2>
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
            <label htmlFor="q" className="font-display text-[26px] font-medium">{d.question}</label>
            <textarea id="q" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canRun) run(); }} rows={2} placeholder={d.qph}
              className="mt-3 w-full bg-dusk border border-line rounded-[6px] p-4 text-[18px] placeholder:text-fog/70 focus:border-torch outline-none resize-y" />
            <div className="mt-3 flex flex-wrap gap-2 items-center text-[14px]">
              <span className="text-fog mr-1">{d.examples}:</span>
              {EXAMPLES.map((ex) => (
                <button key={ex.label} onClick={() => { setQuestion(ex.q); if (ex.q === DEMO_Q && rows.length === 0) DEMO_URLS.forEach(readUrl); }}
                  className="border border-line rounded-full px-3 py-1 hover:border-torch">{ex.label}</button>
              ))}
            </div>

            <div className="mt-10 flex items-baseline justify-between">
              <h2 className="font-display text-[26px] font-medium">{d.sources}</h2>
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
                  className="flex-1 bg-dusk border border-line rounded-[6px] px-4 py-3 text-[16px] focus:border-torch outline-none" />
                <button type="submit" className="border border-white/70 text-white rounded-[4px] px-5 py-3 hover:bg-white hover:text-black">{d.addSource}</button>
                <button type="button" onClick={() => setPasteOpen(!pasteOpen)} className="text-fog hover:text-cream underline underline-offset-4 px-2">{d.paste}</button>
              </form>
            )}
            {rows.length < 6 && <p className="mt-2 text-[13px] text-fog">{d.urlMulti}</p>}
            {pasteOpen && (
              <div className="mt-4 bg-dusk border border-line rounded-[14px] p-4 space-y-3">
                <input value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder={d.pasteTitle} aria-label={d.pasteTitle} className="w-full bg-night border border-line rounded-[8px] px-3 py-2" />
                <textarea value={pText} onChange={(e) => setPText(e.target.value)} placeholder={d.pasteBody} aria-label={d.pasteBody} rows={6} className="w-full bg-night border border-line rounded-[8px] px-3 py-2" />
                <div className="flex gap-4"><button onClick={addPaste} className="bg-white text-black rounded-[4px] px-4 py-2 font-medium hover:bg-[#eef2f3]">{d.save}</button><button onClick={() => setPasteOpen(false)} className="text-fog">{d.cancel}</button></div>
              </div>
            )}
            {error && <p role="alert" className="mt-6 text-torch">{error}</p>}
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <button disabled={!canRun} onClick={() => run()} className="bg-white text-black font-medium text-[17px] px-7 py-4 rounded-[4px] disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#eef2f3] transition-[background,transform,box-shadow] duration-200 enabled:hover:-translate-y-px enabled:hover:shadow-[0_8px_22px_rgba(0,0,0,.2)]">{d.analyse}</button>
              <button onClick={loadDemo} className="text-fog hover:text-cream underline underline-offset-4">{d.demo}</button>
              <span className="hidden sm:inline text-[13px] text-fog/70">{d.shortcut}</span>
            </div>
            {history.length > 0 && (
              <div className="mt-14">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-[22px] font-medium">{d.recent}</h2>
                  <button onClick={() => { setHistory([]); try { localStorage.removeItem("gaplens:history"); } catch {} }} className="text-fog hover:text-cream text-[14px] underline underline-offset-4">{d.clearRecent}</button>
                </div>
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {history.map((h) => (
                    <li key={h.report.createdAt + h.report.question}>
                      <button onClick={() => openHistory(h)} className="w-full text-left py-3 flex items-center gap-4 hover:text-torch">
                        <span className="font-display text-[20px] text-torch w-14 shrink-0">{h.report.coverage}%</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[16px]">{h.report.question}</span>
                          <span className="block text-[13px] text-fog">{h.sources.length} {d.sourcesShort}, {d.counts(h.report.gaps.length, h.report.conflicts.length, h.report.outdated.length)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
          <h1 className="font-display text-[28px] sm:text-[36px] font-medium leading-tight max-w-[30ch]">{r.question}</h1>
          <div className="no-print flex flex-wrap gap-x-4 gap-y-2 text-[15px]">
            <button onClick={copyChecklist} className="text-fog hover:text-cream underline underline-offset-4" aria-live="polite">{copied ? d.copy : d.copyList}</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(toChecklist(r, d))}`} target="_blank" rel="noreferrer" className="text-fog hover:text-cream underline underline-offset-4">{d.whatsapp}</a>
            <button onClick={() => window.print()} className="text-fog hover:text-cream underline underline-offset-4">{d.print}</button>
            <button onClick={exportMd} className="text-fog hover:text-cream underline underline-offset-4">{d.export}</button>
            <button onClick={() => { setReport(null); setRows([]); setQuestion(""); cache.current = null; setView("work"); }} className="text-fog hover:text-cream underline underline-offset-4">{d.newRun}</button>
          </div>
        </div>
        {isDemo && <p className="text-[14px] text-fog mt-2">{d.demoNote}</p>}
        {!isDemo && r.lang !== lang && (
          <button onClick={() => run(lang)} className="no-print mt-3 text-[15px] text-torch underline underline-offset-4">{lang === "hi" ? t("hi").rerunIn : t("en").rerunIn.replace("in English. Re-run in Hindi", "in Hindi. Re-run in English")}</button>
        )}
        <div className="mt-8 flex flex-col lg:flex-row lg:items-end gap-6 justify-between border-b border-line pb-8">
          <Score value={r.coverage} d={d} report={r} />
          {r.summary && <p className="text-[18px] text-cream/90 max-w-[56ch] lg:pb-2">{r.summary}</p>}
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-8">
        <div className="space-y-12 order-2 lg:order-1">
          <div className="bg-dusk rounded-[14px] p-5 sm:p-6">
            <h2 className="font-display text-[22px] font-medium mb-4">{d.map}</h2>
            <CoverageMap report={r} d={d} onOpen={openCell} />
          </div>
          <Findings report={r} d={d} onQuote={setOpenFact} />
        </div>
        <aside className="order-1 lg:order-2 bg-dusk rounded-[14px] p-5 sm:p-6 self-start">
          <h2 className="font-display text-[26px] font-medium mb-5">{d.verify}</h2>
          <VerifyList report={r} d={d} />
          <p className="mt-10 text-[14px] text-fog">{d.disclaimer}</p>
        </aside>
      </section>
      <EvidenceDrawer fact={openFact} source={openFact ? srcText[openFact.sourceId] : undefined} d={d} onClose={() => setOpenFact(null)} />
    </main>
  );
}
