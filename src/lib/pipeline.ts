import { chatJSON, MODELS } from "./llm";
import type { Aspect, Conflict, Fact, Gap, Lang, Outdated, Report, Source, VerifyItem, AspectStatus } from "./types";

/* ---------- 1. Aspects: what a complete answer needs ---------- */
export async function getAspects(question: string): Promise<Aspect[]> {
  const sys = `You plan research checklists. Given a user's question, list 8 to 9 SPECIFIC, checkable facts a reader must have before acting on the answer.
Each aspect is one concrete fact a careful official would state, not a broad topic. Good: "Family income limit", "Minimum marks to renew", "Fresh application last date", "Institute verification deadline", "Bank account / Aadhaar seeding", "Award amount per year". Bad: "Eligibility criteria", "Process", "Documents".
Include the details people usually get wrong or that pages often skip (exact limits, exact dates for THIS cycle, who verifies, what happens if you miss it, helpline).
Return JSON: {"aspects":[{"id":"a1","label":"short label, max 5 words","why":"one sentence on why a reader needs it","importance":"high|med|low"}]}
Rules: labels in English, sentence case, no numbering. 3 to 4 high, the rest med or low.`;
  const out = await chatJSON<{ aspects: Aspect[] }>(sys, `Question: ${question}`, { models: [MODELS.big, MODELS.alt, MODELS.small], maxTokens: 1500 });
  type Raw = Partial<Aspect> & { name?: unknown; title?: unknown; aspect?: unknown };
  const pickLabel = (a: Raw) => [a.label, a.name, a.title, a.aspect].find((v) => typeof v === "string" && v.trim() && v.trim() !== "undefined") as string | undefined;
  return ((out.aspects ?? []) as Raw[]).filter((a) => pickLabel(a)).slice(0, 9).map((a, i) => ({
    id: `a${i + 1}`, label: pickLabel(a)!.trim().slice(0, 48), why: typeof a.why === "string" ? a.why : "",
    importance: (["high", "med", "low"].includes(String(a.importance)) ? a.importance : "med") as Aspect["importance"],
  }));
}

/* ---------- 2. Evidence: relevance filter (code) + extraction (LLM) + verify (code) ---------- */
const STOP = new Set("the a an and or of to for in on at is are be by with how what who do i my your this that from as it can will which when where".split(" "));
function tokens(s: string) { return s.toLowerCase().replace(/[^a-z0-9\u0900-\u097f ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)); }

/** Keep the paragraphs most related to the question + aspects, within a word budget. */
export function focusText(text: string, question: string, aspects: Aspect[], budget = 1100): string {
  const keys = new Set([...tokens(question), ...aspects.flatMap((a) => tokens(a.label + " " + a.why))]);
  let paras = text.split(/\n{1,}/).map((p) => p.trim()).filter((p) => p.split(/\s+/).length >= 6);
  // split very long paragraphs into ~120-word pieces
  paras = paras.flatMap((p) => { const w = p.split(/\s+/); if (w.length <= 160) return [p]; const out: string[] = []; for (let i = 0; i < w.length; i += 120) out.push(w.slice(i, i + 120).join(" ")); return out; });
  const scored = paras.map((p, i) => {
    const t = tokens(p); const hits = t.filter((w) => keys.has(w)).length;
    const nums = (p.match(/₹|rs\.?|lakh|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\b20\d{2}\b|%|marks|income|document|certificate/gi) ?? []).length;
    return { i, p, s: hits / Math.sqrt(t.length + 4) + nums * 0.15 };
  });
  const picked: typeof scored = []; let used = 0;
  for (const x of [...scored].sort((a, b) => b.s - a.s)) {
    const n = x.p.split(/\s+/).length; if (used + n > budget) continue; picked.push(x); used += n; if (used > budget - 20) break;
  }
  return picked.sort((a, b) => a.i - b.i).map((x) => x.p).join("\n");
}

export function norm(s: string) {
  return s.toLowerCase().replace(/[“”"‘’'`]/g, "").replace(/[–—-]/g, "-").replace(/\s+/g, " ").replace(/[^\p{L}\p{N}₹%\-./, ]/gu, "").trim();
}

/** How closely a quote matches the source: "exact" (normalised substring), "near" (>=85% of its words in one run), or "none". */
export function quoteMatch(quote: string, sourceText: string): "exact" | "near" | "none" {
  const q = norm(quote); const t = norm(sourceText);
  if (q.length < 8) return "none";
  if (t.includes(q)) return "exact";
  const qw = q.split(" "); if (qw.length < 4) return "none";
  // sliding window: fraction of quote words that appear in order in the best-matching window
  let best = 0;
  for (let n = qw.length; n >= Math.ceil(qw.length * 0.85); n--) {
    for (let i = 0; i + n <= qw.length; i++) { if (t.includes(qw.slice(i, i + n).join(" "))) { best = n / qw.length; break; } }
    if (best) break;
  }
  return best >= 0.85 ? "near" : "none";
}

export function verifyQuote(quote: string, sourceText: string): boolean { return quoteMatch(quote, sourceText) !== "none"; }

export async function getEvidence(question: string, aspects: Aspect[], source: Source, model: string): Promise<Fact[]> {
  const excerpt = focusText(source.text, question, aspects);
  const sys = `You extract evidence from ONE source for a research question. You never use outside knowledge.
For each aspect the source actually addresses, return the facts it states with an EXACT quote copied character-for-character from the source (8 to 40 words, one continuous span, no ellipsis). If the source says nothing on an aspect, return nothing for it. Never invent or paraphrase inside "quote".
Return JSON: {"facts":[{"aspect_id":"a1","statement":"plain-English fact, max 25 words","quote":"exact span","value":"the key number/date/amount if any, else empty"}]}
Max 2 facts per aspect, max 12 facts total.`;
  const user = `Question: ${question}
Aspects:
${aspects.map((a) => `${a.id}: ${a.label}`).join("\n")}

Source "${source.title}" (${source.site}${source.date ? ", dated " + source.date : ""}):
"""
${excerpt}
"""`;
  const order = [model, ...[MODELS.small, MODELS.alt, MODELS.big].filter((m) => m !== model)];
  const out = await chatJSON<{ facts: { aspect_id: string; statement: string; quote: string; value?: string }[] }>(sys, user, { models: order, maxTokens: 2200 });
  const ids = new Set(aspects.map((a) => a.id));
  return (out.facts ?? [])
    .filter((f) => ids.has(f.aspect_id) && f.quote && f.statement)
    .slice(0, 14)
    .map((f, i) => ({
      id: `${source.id}-f${i + 1}`, aspectId: f.aspect_id, sourceId: source.id,
      statement: String(f.statement).slice(0, 220), quote: String(f.quote).slice(0, 400), value: f.value ? String(f.value).slice(0, 60) : undefined,
      ...(() => { const m = quoteMatch(String(f.quote), source.text); return { verified: m !== "none", match: m }; })(),
    }));
}

/* ---------- 3. Synthesis (LLM) + deterministic scoring (code) ---------- */
interface SynthOut {
  conflicts?: { aspect_id: string; fact_a: string; fact_b: string; explanation: string; confidence?: string }[];
  gap_notes?: { aspect_id: string; why: string }[];
  outdated?: { source_id: string; reason: string }[];
  verify_next?: { action: string; why: string; where: string; aspect_id?: string }[];
  summary?: string;
}

export async function synthesize(question: string, lang: Lang, aspects: Aspect[], sources: Omit<Source, "text">[], facts: Fact[]): Promise<Report> {
  const usable = facts.filter((f) => f.verified);
  const byAspect = new Map<string, Fact[]>();
  for (const f of usable) byAspect.set(f.aspectId, [...(byAspect.get(f.aspectId) ?? []), f]);
  const missing = aspects.filter((a) => !byAspect.get(a.id)?.length);
  const today = new Date().toISOString().slice(0, 10);

  const sys = `You are GapLens, an information-gap auditor. You do NOT answer the question. You judge what the evidence covers, where it disagrees, what is stale, and what the reader must verify next. Use only the facts given.
Return JSON:
{"conflicts":[{"aspect_id":"a2","fact_a":"s1-f2","fact_b":"s3-f1","explanation":"what differs, one sentence","confidence":"high|med|low"}],
 "gap_notes":[{"aspect_id":"<id of a missing aspect>","why":"why this missing info matters to the reader, one sentence"}],
 "outdated":[{"source_id":"s1","reason":"one sentence, e.g. mentions 2023-24 cycle"}],
 "verify_next":[{"action":"imperative, max 12 words","why":"max 14 words","where":"most likely official place to check","aspect_id":"a3"}],
 "summary":"one or two sentences on overall coverage, naming the biggest gap and the biggest conflict"}
Rules: fact_a and fact_b are bare fact ids only. A conflict is two facts from different sources that give different values, dates, limits or rules for the same thing (e.g. two different deadlines, two income limits, renewal allowed vs not). Use confidence "low" when they may refer to different schemes; still list it so the reader can check. Do not list facts that merely add different detail. Only flag outdated when facts or dates clearly point to an older cycle than today (${today}). verify_next: 3 to 6 items, most important first. Write "why", "explanation", "reason", "action", "where" and "summary" in ${lang === "hi" ? "simple Hindi (Devanagari)" : "plain English"}.`;
  const user = `Question: ${question}
Today: ${today}
Sources:
${sources.map((s) => `${s.id}: ${s.title} | ${s.site} | date: ${s.date ?? "none found"} | years mentioned: ${(s.years ?? []).join(", ") || "none"}`).join("\n")}
Aspects (with verified facts):
${aspects.map((a) => `${a.id} ${a.label} [${a.importance}]\n${(byAspect.get(a.id) ?? []).map((f) => `  - ${f.id} (${f.sourceId}): ${f.statement}${f.value ? " | value: " + f.value : ""}`).join("\n") || "  - NO EVIDENCE"}`).join("\n")}`;
  let out: SynthOut = {};
  try { out = await chatJSON<SynthOut>(sys, user, { models: [MODELS.big, MODELS.alt, MODELS.small], maxTokens: 3000 }); } catch { out = {}; }
  if (process.env.GAPLENS_DEBUG) console.log("SYNTH", JSON.stringify(out.conflicts), JSON.stringify(out.outdated));

  const factIds = new Map(usable.map((f) => [f.id, f]));
  const aspectIds = new Set(aspects.map((a) => a.id));
  const fid = (x: unknown) => (String(x ?? "").match(/s\d+-f\d+/) ?? [""])[0];
  const conflicts: Conflict[] = (out.conflicts ?? [])
    .map((c) => ({ ...c, fact_a: fid(c.fact_a), fact_b: fid(c.fact_b) }))
    .filter((c) => factIds.get(c.fact_a)?.aspectId === factIds.get(c.fact_b)?.aspectId)
    .filter((c) => factIds.has(c.fact_a) && factIds.has(c.fact_b) && factIds.get(c.fact_a)!.sourceId !== factIds.get(c.fact_b)!.sourceId)
    .slice(0, 6)
    .map((c, i) => ({ id: `c${i + 1}`, aspectId: factIds.get(c.fact_a)!.aspectId, factA: c.fact_a, factB: c.fact_b, explanation: c.explanation, confidence: (["high", "med", "low"].includes(c.confidence ?? "") ? c.confidence : "med") as Conflict["confidence"] }));

  const gapNote = new Map((out.gap_notes ?? []).map((g) => [g.aspect_id, g.why]));
  const gaps: Gap[] = missing.map((a, i) => ({ id: `g${i + 1}`, aspectId: a.id, why: gapNote.get(a.id) || a.why, kind: "missing" as const }));
  for (const a of aspects) {
    const srcs = new Set((byAspect.get(a.id) ?? []).map((f) => f.sourceId));
    if (srcs.size === 1 && a.importance !== "low") gaps.push({ id: `g${gaps.length + 1}`, aspectId: a.id, kind: "single",
      why: lang === "hi" ? "सिर्फ़ एक स्रोत यह बताता है, किसी और से पुष्टि नहीं हुई।" : "Only one source covers this, so nothing confirms it yet." });
  }

  // outdated: code rule first (undated/old), LLM adds reasons
  const llmOld = new Map((out.outdated ?? []).map((o) => [o.source_id, o.reason]));
  const outdated: Outdated[] = [];
  for (const s of sources) {
    if (llmOld.has(s.id)) outdated.push({ id: `o${outdated.length + 1}`, sourceId: s.id, reason: llmOld.get(s.id)! });
    else if (s.dateStatus === "undated") outdated.push({ id: `o${outdated.length + 1}`, sourceId: s.id, reason: lang === "hi" ? "पेज पर कोई तारीख नहीं मिली, पता नहीं कितना ताज़ा है।" : "No date found on the page, so it may not be current." });
    else if (s.dateStatus === "old") outdated.push({ id: `o${outdated.length + 1}`, sourceId: s.id, reason: lang === "hi" ? `आखिरी अपडेट ${s.date}, एक साल से ज़्यादा पुराना।` : `Last updated ${s.date}, more than a year ago.` });
  }

  // matrix + status (deterministic)
  const conflictAspects = new Set(conflicts.map((c) => c.aspectId));
  const conflictFacts = new Set(conflicts.flatMap((c) => [c.factA, c.factB]));
  const matrix: Report["matrix"] = {};
  const scored = aspects.map((a) => {
    const fs = byAspect.get(a.id) ?? [];
    const srcs = [...new Set(fs.map((f) => f.sourceId))];
    matrix[a.id] = {};
    for (const s of sources) {
      const mine = fs.filter((f) => f.sourceId === s.id);
      matrix[a.id][s.id] = mine.some((f) => conflictFacts.has(f.id)) ? "conflict" : mine.length >= 2 ? "covered" : mine.length === 1 ? "partial" : "none";
    }
    const status: AspectStatus = conflictAspects.has(a.id) ? "conflict" : srcs.length === 0 ? "missing" : srcs.length === 1 ? "partial" : "covered";
    return { ...a, status, sourceIds: srcs };
  });
  const w = { high: 3, med: 2, low: 1 } as const;
  const credit = { covered: 1, partial: 0.5, conflict: 0.35, missing: 0 } as const;
  const total = scored.reduce((s, a) => s + w[a.importance], 0) || 1;
  const coverage = Math.round((scored.reduce((s, a) => s + w[a.importance] * credit[a.status], 0) / total) * 100);

  const pr = (a?: string): VerifyItem["priority"] => { const x = scored.find((s) => s.id === a); if (!x) return "med"; if (x.status === "conflict" || (x.status === "missing" && x.importance === "high")) return "high"; if (x.status === "missing" || x.importance === "high") return "med"; return "low"; };
  const rank = { high: 0, med: 1, low: 2 };
  const verifyNext: VerifyItem[] = (out.verify_next ?? [])
    .slice(0, 6)
    .map((v, i) => ({ id: `v${i + 1}`, priority: pr(v.aspect_id && aspectIds.has(v.aspect_id) ? v.aspect_id : undefined), action: v.action, why: v.why, where: v.where, aspectId: v.aspect_id && aspectIds.has(v.aspect_id) ? v.aspect_id : undefined }))
    .sort((a, b) => rank[a.priority] - rank[b.priority]);
  // guarantee every high-importance gap and conflict is on the list
  for (const a of scored) {
    if ((a.status === "missing" && a.importance === "high") || a.status === "conflict") {
      if (!verifyNext.some((v) => v.aspectId === a.id)) verifyNext.push({ id: `v${verifyNext.length + 1}`, priority: "high", aspectId: a.id,
        action: lang === "hi" ? `"${a.label}" आधिकारिक स्रोत पर जाँचें` : `Confirm "${a.label.toLowerCase()}" on an official source`,
        why: a.status === "conflict" ? (lang === "hi" ? "स्रोतों में टकराव है" : "Your sources disagree") : (lang === "hi" ? "किसी स्रोत में नहीं मिला" : "None of your sources cover it"),
        where: lang === "hi" ? "आधिकारिक पोर्टल या योजना दिशानिर्देश" : "Official portal or scheme guidelines" });
    }
  }
  verifyNext.sort((a, b) => rank[a.priority] - rank[b.priority]);

  return {
    question, lang, createdAt: new Date().toISOString(), sources, aspects: scored, matrix,
    facts: usable.concat(facts.filter((f) => !f.verified)), gaps, conflicts, outdated, verifyNext, coverage,
    summary: out.summary ?? "",
  };
}
