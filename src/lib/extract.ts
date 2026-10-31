import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";
import type { DateStatus, Source } from "./types";

const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.|\[?::1\]?$)/i;
const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";

export function cleanText(t: string) {
  return t.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
}

export function countWords(t: string) {
  return t.split(/\s+/).filter(Boolean).length;
}

/** Find the newest date-ish signal in metadata or text. Returns ISO yyyy-mm-dd or yyyy. */
export function detectDate(meta: string[], text: string): string | undefined {
  const cands: Date[] = [];
  for (const m of meta) {
    const d = new Date(m);
    if (!isNaN(+d) && d.getFullYear() > 2000) cands.push(d);
  }
  const head = text.slice(0, 4000);
  const re1 = new RegExp(`(?:updated|published|posted|last updated|modified)[^\\d]{0,20}(\\d{1,2})(?:st|nd|rd|th)?[\\s\\-/.,]*(${MONTHS})[a-z]*[\\s\\-/.,]*(20\\d{2})`, "gi");
  const re2 = new RegExp(`(?:updated|published|posted|last updated|modified)[^\\w]{0,20}(${MONTHS})[a-z]*\\s+(\\d{1,2}),?\\s+(20\\d{2})`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re1.exec(head))) { const d = new Date(`${m[2]} ${m[1]} ${m[3]}`); if (!isNaN(+d)) cands.push(d); }
  while ((m = re2.exec(head))) { const d = new Date(`${m[1]} ${m[2]} ${m[3]}`); if (!isNaN(+d)) cands.push(d); }
  if (!cands.length) return undefined;
  const now = Date.now();
  const valid = cands.filter((d) => +d <= now + 86400000 * 2);
  if (!valid.length) return undefined;
  const newest = valid.sort((a, b) => +b - +a)[0];
  return newest.toISOString().slice(0, 10);
}

/** Academic / calendar years mentioned in text, e.g. "2026-27" or "2024". */
export function detectYears(text: string): string[] {
  const s = new Set<string>();
  for (const m of text.matchAll(/\b(20\d{2})\s*[-–]\s*(\d{2}|20\d{2})\b/g)) s.add(`${m[1]}-${m[2].slice(-2)}`);
  return [...s].sort().slice(-4);
}

export function dateStatus(date: string | undefined, now = new Date()): DateStatus {
  if (!date) return "undated";
  const d = new Date(date);
  const ageDays = (+now - +d) / 86400000;
  return ageDays > 365 ? "old" : "dated";
}

export async function extractUrl(url: string, id: string): Promise<Source> {
  let u: URL;
  try { u = new URL(url); } catch { throw new Error("That doesn't look like a web address."); }
  if (!/^https?:$/.test(u.protocol) || PRIVATE.test(u.hostname)) throw new Error("This address can't be read.");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  let html = "";
  try {
    const res = await fetch(u, {
      signal: ctrl.signal, redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 GapLens/1.0",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`The site answered ${res.status}.`);
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("pdf")) throw new Error("PDFs aren't supported yet. Paste its text instead.");
    const buf = await res.arrayBuffer();
    html = new TextDecoder().decode(buf.slice(0, 2_500_000));
  } finally { clearTimeout(timer); }

  const { document } = parseHTML(html);
  const metaSel = [
    'meta[property="article:modified_time"]', 'meta[property="article:published_time"]', 'meta[property="og:updated_time"]',
    'meta[name="date"]', 'meta[itemprop="dateModified"]', 'meta[itemprop="datePublished"]', 'meta[name="last-modified"]',
  ];
  const meta: string[] = [];
  for (const s of metaSel) { const c = document.querySelector(s)?.getAttribute("content"); if (c) meta.push(c); }
  for (const t of document.querySelectorAll("time[datetime]")) { const v = t.getAttribute("datetime"); if (v) meta.push(v); }
  for (const sc of document.querySelectorAll('script[type="application/ld+json"]')) {
    const raw = sc.textContent ?? "";
    for (const m of raw.matchAll(/"date(?:Modified|Published)"\s*:\s*"([^"]+)"/g)) meta.push(m[1]);
  }
  const title = (document.querySelector('meta[property="og:title"]')?.getAttribute("content") || document.title || u.hostname).trim();

  let text = "";
  try {
    const art = new Readability(document as unknown as Document, { charThreshold: 300 }).parse();
    text = art?.textContent ?? "";
  } catch { /* fall through */ }
  if (countWords(text) < 120) {
    const { document: d2 } = parseHTML(html);
    d2.querySelectorAll("script,style,noscript,nav,footer,header,svg").forEach((n) => n.remove());
    text = d2.body?.textContent ?? "";
  }
  text = cleanText(text);
  if (countWords(text) < 60) throw new Error("Couldn't read this page. Paste its text instead.");
  const date = detectDate(meta, text);
  return {
    id, url: u.toString(), title: title.slice(0, 140), site: u.hostname.replace(/^www\./, ""),
    date, dateStatus: dateStatus(date), text: text.slice(0, 60000), words: countWords(text), years: detectYears(text),
  };
}

export function fromPastedText(text: string, title: string, id: string): Source {
  const t = cleanText(text);
  const date = detectDate([], t);
  return { id, title: title || "Pasted text", site: "pasted text", date, dateStatus: dateStatus(date), text: t.slice(0, 60000), words: countWords(t), years: detectYears(t) };
}
