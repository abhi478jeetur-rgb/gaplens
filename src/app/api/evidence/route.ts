import { NextResponse } from "next/server";
import { getEvidence } from "@/lib/pipeline";
import { MODELS } from "@/lib/llm";
import { err } from "@/lib/http";
import { limit, CAPS, tooBig } from "@/lib/guard";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: Request) {
  const blocked = limit(req, "evidence", 40); if (blocked) return blocked;
  try {
    const { question, aspects, source, slot } = await req.json();
    if (!Array.isArray(aspects) || aspects.length > CAPS.aspects || !source || String(source.text ?? "").length > CAPS.sourceChars) return tooBig("Input too large.");
    const model = [MODELS.small, MODELS.alt, MODELS.big][Number(slot ?? 0) % 3];
    return NextResponse.json({ facts: await getEvidence(String(question), aspects, source, model) });
  } catch (e) { return err(e); }
}
