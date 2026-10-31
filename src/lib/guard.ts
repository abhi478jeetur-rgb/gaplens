import { NextResponse } from "next/server";

/**
 * Best-effort abuse guard for the API routes: a sliding-window limit per IP
 * (per server instance) plus hard caps on input size. Keeps one visitor or bot
 * from burning the shared Groq quota while judges are trying the app.
 */
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

export function limit(req: Request, route: string, max: number): NextResponse | null {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "anon";
  const key = `${route}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    const retry = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
    return NextResponse.json({ error: "busy" }, { status: 429, headers: { "Retry-After": String(retry) } });
  }
  recent.push(now); hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return null;
}

export const CAPS = { question: 500, sources: 6, aspects: 12, sourceChars: 200_000, pasteChars: 60_000, facts: 120 } as const;

export function tooBig(msg: string) { return NextResponse.json({ error: msg }, { status: 413 }); }
