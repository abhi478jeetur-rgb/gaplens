"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Fact, Report, Source } from "@/lib/types";
import type { Dict } from "@/lib/i18n";

type Cell = "covered" | "partial" | "conflict" | "none";

function CellBox({ v, delay, label }: { v: Cell; delay: number; label: string }) {
  const base = "cell h-9 rounded-[8px] grid place-items-center text-[13px] font-semibold";
  const style: React.CSSProperties = { animationDelay: `${delay}ms` };
  if (v === "covered") return <div className={`${base} bg-torch text-night`} style={style} title={label} aria-label={label}>✓</div>;
  if (v === "partial") return <div className={`${base} bg-torchdim/60 border border-torch/70 text-cream`} style={style} title={label} aria-label={label}>1</div>;
  if (v === "conflict")
    return (
      <div className={`${base} border-2 border-torch text-torch`} title={label} aria-label={label}
        style={{ ...style, backgroundImage: "repeating-linear-gradient(135deg, rgba(251,191,36,.35) 0 4px, transparent 4px 9px)" }}>!</div>
    );
  return <div className={`${base} bg-night border border-line`} style={style} title={label} aria-label={label} />;
}

export function CoverageMap({ report, d, onOpen }: { report: Report; d: Dict; onOpen: (aspectId: string, sourceId: string) => void }) {
  const cols = report.sources;
  return (
    <div className="relative overflow-hidden">
      <div className="beam pointer-events-none absolute inset-x-0 top-0 h-24 bg-torch" aria-hidden />
      <div className="overflow-x-auto">
        <table className="w-full border-separate" style={{ borderSpacing: "6px" }}>
          <caption className="sr-only">{d.map}</caption>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[#0b2635] text-left font-normal text-fog text-sm min-w-[132px]" />
              {cols.map((s) => (
                <th key={s.id} scope="col" className="text-[13px] font-medium text-fog text-left min-w-[64px] max-w-[104px] truncate" title={s.title}>
                  {s.site.replace(/\.(com|in|org|wiki|gov\.in)$/,"").replace(/^school\./, "")}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {report.aspects.map((a, ri) => {
              const dark = a.status === "missing";
              return (
                <tr key={a.id}>
                  <th scope="row" className="sticky left-0 z-10 bg-[#0b2635] text-left font-normal text-[15px] pr-2">
                    <span className={a.importance === "high" ? "text-cream" : "text-cream/80"}>{a.label}</span>
                  </th>
                  {cols.map((s, ci) => {
                    const v = report.matrix[a.id]?.[s.id] ?? "none";
                    const label = `${a.label}, ${s.site}: ${v === "none" ? d.missing : v === "covered" ? d.covered : v === "partial" ? d.partial : d.conflict}`;
                    return (
                      <td key={s.id} className={dark ? "dark-row rounded-[8px]" : ""}>
                        {v === "none" ? <CellBox v={v} delay={ri * 90 + ci * 40} label={label} /> : (
                          <button className="w-full" onClick={() => onOpen(a.id, s.id)} aria-label={`${d.openQuote}: ${label}`}>
                            <CellBox v={v} delay={ri * 90 + ci * 40} label={label} />
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="pl-1 whitespace-nowrap text-[13px]">
                    {dark && <span className="text-torch border border-dashed border-torch rounded-full px-2 py-0.5">{d.darkSpot}</span>}
                    {a.status === "conflict" && <span className="text-torch">{d.conflict}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-fog">
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-torch inline-block" />{d.covered.replace("2+", "this")}</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-torchdim/60 border border-torch/70 inline-block" />1 fact</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded border-2 border-torch inline-block" style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(251,191,36,.35) 0 3px, transparent 3px 6px)" }} />{d.conflict}</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-night border border-line inline-block" />{d.missing}</span>
      </div>
    </div>
  );
}

export function Score({ value, d, report }: { value: number; d: Dict; report: Report }) {
  const [n, setN] = useState(value);
  const shown = useRef<number | null>(null);
  useEffect(() => {
    // Count up once per new report; never drop back to 0 on re-renders.
    if (shown.current === value) return;
    const from = shown.current ?? 0; shown.current = value;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || from === value) { setN(value); return; }
    let raf = 0; const t0 = performance.now();
    setN(from);
    const step = (t: number) => { const p = Math.min(1, (t - t0) / 900); setN(Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); else setN(value); };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); setN(value); };
  }, [value]);
  const darkSpots = report.gaps.filter((g) => g.kind === "missing").length;
  return (
    <div className="flex items-end gap-5">
      <div className="font-display font-medium text-torch leading-none text-[72px] tabular-nums" aria-label={`${value}% ${d.coverage}`}>{n}%</div>
      <div className="pb-2">
        <div className="text-[22px] font-medium">{d.lit(value)}</div>
        <div className="text-fog text-[15px]">{d.counts(darkSpots, report.conflicts.length, report.outdated.length)}</div>
      </div>
    </div>
  );
}

export function VerifyList({ report, d }: { report: Report; d: Dict }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const aspect = (id?: string) => report.aspects.find((a) => a.id === id)?.label;
  return (
    <ol className="space-y-5">
      {report.verifyNext.map((v, i) => (
        <li key={v.id} className={`flex gap-4 transition-opacity ${done[v.id] ? "opacity-45" : ""}`}>
          <input id={`chk-${v.id}`} type="checkbox" checked={!!done[v.id]} onChange={(e) => setDone({ ...done, [v.id]: e.target.checked })}
            className="mt-1.5 h-5 w-5 shrink-0 accent-[#FBBF24] cursor-pointer" />
          <label htmlFor={`chk-${v.id}`} className="cursor-pointer">
            <span className={`text-[14px] font-semibold ${v.priority === "high" ? "text-torch" : "text-fog"}`}>{i + 1}. {d.importance[v.priority]}</span>
            {aspect(v.aspectId) && <span className="text-[14px] text-fog">, {aspect(v.aspectId)}</span>}
            <span className={`block text-[18px] leading-snug mt-0.5 ${done[v.id] ? "line-through" : ""}`}>{v.action}</span>
            <span className="block text-[14px] text-fog mt-1">{d.why}: {v.why}</span>
            <span className="block text-[14px] text-fog">{d.where}: {v.where}</span>
          </label>
        </li>
      ))}
    </ol>
  );
}

function FactLine({ f, report, d, onQuote }: { f: Fact; report: Report; d: Dict; onQuote: (f: Fact) => void }) {
  const s = report.sources.find((x) => x.id === f.sourceId);
  return (
    <li className="py-3 border-b border-line last:border-0">
      <p className="text-[16px]">{f.statement}</p>
      <p className="text-[14px] text-fog mt-1">
        {s?.site}{" "}
        <button onClick={() => onQuote(f)} className="text-torch underline underline-offset-4 decoration-1 hover:decoration-2 ml-2">{d.openQuote}</button>
        {!f.verified && <span className="ml-2">({d.unverified})</span>}
        {f.verified && f.match === "near" && <span className="ml-2">(≈ {d.nearShort})</span>}
      </p>
    </li>
  );
}

export function Findings({ report, d, onQuote }: { report: Report; d: Dict; onQuote: (f: Fact) => void }) {
  const [tab, setTab] = useState<"gaps" | "conflicts" | "confirmed" | "outdated">("gaps");
  const facts = report.facts.filter((f) => f.verified);
  const byId = useMemo(() => new Map(report.facts.map((f) => [f.id, f])), [report]);
  const aspect = (id: string) => report.aspects.find((a) => a.id === id);
  const tabs = [
    ["gaps", d.tGaps, report.gaps.length], ["conflicts", d.tConflicts, report.conflicts.length],
    ["confirmed", d.tConfirmed, facts.length], ["outdated", d.tOutdated, report.outdated.length],
  ] as const;
  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-line">
        {tabs.map(([k, label, n]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`px-3 py-2.5 text-[15px] -mb-px border-b-2 transition-colors ${tab === k ? "border-torch text-cream" : "border-transparent text-fog hover:text-cream"}`}>
            {label} <span className="tabular-nums text-fog">{n}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-4">
        {tab === "gaps" && (report.gaps.length ? (
          <ul className="space-y-4">
            {report.gaps.map((g) => (
              <li key={g.id} className="flex gap-3">
                <span className={`mt-1 h-4 w-4 shrink-0 rounded ${g.kind === "missing" ? "border border-dashed border-torch" : "bg-torchdim/60 border border-torch/70"}`} aria-hidden />
                <div>
                  <p className="text-[17px]"><span className="font-semibold">{aspect(g.aspectId)?.label}</span> <span className="text-torch text-[14px] ml-1">{g.kind === "missing" ? d.missingGap : d.singleGap}</span></p>
                  <p className="text-fog text-[15px]">{g.why}</p>
                  <p className="text-[13px] text-fog mt-0.5">Potential gap</p>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-fog">{d.noGaps}</p>)}

        {tab === "conflicts" && (report.conflicts.length ? (
          <ul className="space-y-6">
            {report.conflicts.map((c) => {
              const a = byId.get(c.factA); const b = byId.get(c.factB);
              return (
                <li key={c.id}>
                  <p className="text-[17px] font-semibold">{aspect(c.aspectId)?.label}</p>
                  <p className="text-fog text-[15px]">{c.explanation} <span className="text-[13px]">({d.confidence}: {d.importance[c.confidence] ?? c.confidence})</span></p>
                  <div className="mt-2 grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-start">
                    {[a, b].map((f, i) => f ? (
                      <div key={f.id} className={`${i === 1 ? "sm:order-3" : ""} border-l-2 border-torch pl-3`}>
                        <p className="text-[13px] text-fog">{report.sources.find((s) => s.id === f.sourceId)?.site}</p>
                        <p className="text-[15px] italic">&ldquo;{f.quote}&rdquo;</p>
                        <button onClick={() => onQuote(f)} className="text-torch text-[14px] underline underline-offset-4 mt-1">{d.openQuote}</button>
                      </div>
                    ) : null)}
                    <span className="sm:order-2 text-fog text-[14px] self-center">{d.vs}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-fog">{d.noConflicts}</p>)}

        {tab === "confirmed" && (
          <div className="space-y-5">
            {report.aspects.filter((a) => facts.some((f) => f.aspectId === a.id)).map((a) => (
              <section key={a.id}>
                <h4 className="font-display text-[19px] font-medium">{a.label}</h4>
                <ul>{facts.filter((f) => f.aspectId === a.id).map((f) => <FactLine key={f.id} f={f} report={report} d={d} onQuote={onQuote} />)}</ul>
              </section>
            ))}
          </div>
        )}

        {tab === "outdated" && (report.outdated.length ? (
          <ul className="space-y-3">
            {report.outdated.map((o) => {
              const s = report.sources.find((x) => x.id === o.sourceId);
              return (
                <li key={o.id} className="flex gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" className="mt-1 shrink-0" aria-hidden><circle cx="12" cy="12" r="9" fill="none" stroke="#94A3B8" strokeWidth="2" /><path d="M12 7v5l3 2" stroke="#94A3B8" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
                  <div><p className="text-[17px]">{s?.title} <span className="text-fog text-[14px]">({s?.site})</span></p><p className="text-fog text-[15px]">{o.reason}</p></div>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-fog">{d.noOutdated}</p>)}
      </div>
    </div>
  );
}

function highlight(text: string, quote: string) {
  const norm = (s: string) => s.replace(/\s+/g, " ");
  const t = norm(text); const q = norm(quote).trim();
  let i = t.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) { const head = q.split(" ").slice(0, 6).join(" "); i = t.toLowerCase().indexOf(head.toLowerCase()); if (i < 0) return { before: t.slice(0, 1600), mark: "", after: "" }; return { before: t.slice(Math.max(0, i - 700), i), mark: t.slice(i, i + q.length), after: t.slice(i + q.length, i + q.length + 900) }; }
  return { before: t.slice(Math.max(0, i - 700), i), mark: t.slice(i, i + q.length), after: t.slice(i + q.length, i + q.length + 900) };
}

export function EvidenceDrawer({ fact, source, d, onClose }: { fact: Fact | null; source?: Source; d: Dict; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  useEffect(() => { if (fact) document.getElementById("mark-q")?.scrollIntoView({ block: "center" }); }, [fact]);
  if (!fact) return null;
  const h = source ? highlight(source.text, fact.quote) : null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={source?.title ?? d.openQuote}>
      <button className="absolute inset-0 bg-night/70" onClick={onClose} aria-label={d.close} />
      <aside className="absolute right-0 bottom-0 top-auto sm:top-0 w-full sm:w-[440px] max-h-[85vh] sm:max-h-none h-auto sm:h-full bg-dusk border-l border-line flex flex-col rounded-t-[14px] sm:rounded-none">
        <div className="p-5 border-b border-line">
          <div className="flex justify-between gap-3">
            <div>
              <p className="text-[13px] text-fog">{source?.site}{source?.date ? `, ${source.date}` : `, ${d.undated}`}</p>
              <h3 className="font-display text-[20px] font-medium leading-tight mt-1">{source?.title}</h3>
            </div>
            <button onClick={onClose} className="text-fog hover:text-cream text-[15px] h-fit">{d.close}</button>
          </div>
          <p className={`text-[14px] mt-3 ${fact.verified ? "text-torch" : "text-fog"}`}>{!fact.verified ? d.unverified : fact.match === "near" ? "≈ " + d.near : "✓ " + d.verified}</p>
          <p className="text-[16px] mt-1">{fact.statement}</p>
        </div>
        <div className="p-5 overflow-y-auto text-[15px] leading-relaxed text-cream/85 flex-1">
          {h ? (<p>{h.before && "… "}{h.before}<mark id="mark-q" className="quote">{h.mark || fact.quote}</mark>{h.after}{" …"}</p>) : <p>&ldquo;{fact.quote}&rdquo;</p>}
        </div>
        {source?.url && (
          <div className="p-5 border-t border-line">
            <a href={source.url} target="_blank" rel="noreferrer" className="text-torch underline underline-offset-4">{d.openOriginal}</a>
          </div>
        )}
      </aside>
    </div>
  );
}
