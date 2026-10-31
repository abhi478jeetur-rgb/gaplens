import { NextResponse } from "next/server";
import { synthesize } from "@/lib/pipeline";
import { err } from "@/lib/http";
import { limit, CAPS, tooBig } from "@/lib/guard";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: Request) {
  const blocked = limit(req, "synthesize", 12); if (blocked) return blocked;
  try {
    const { question, lang, aspects, sources, facts } = await req.json();
    if (String(question).length > CAPS.question * 2 || !Array.isArray(aspects) || aspects.length > CAPS.aspects || !Array.isArray(sources) || sources.length > CAPS.sources || !Array.isArray(facts) || facts.length > CAPS.facts) return tooBig("Input too large.");
    return NextResponse.json({ report: await synthesize(String(question), lang === "hi" ? "hi" : "en", aspects, sources, facts) });
  } catch (e) { return err(e); }
}
