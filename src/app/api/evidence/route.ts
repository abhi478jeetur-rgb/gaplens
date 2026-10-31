import { NextResponse } from "next/server";
import { getEvidence } from "@/lib/pipeline";
import { MODELS } from "@/lib/llm";
import { err } from "@/lib/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    const { question, aspects, source, slot } = await req.json();
    const model = [MODELS.small, MODELS.alt, MODELS.big][Number(slot ?? 0) % 3];
    return NextResponse.json({ facts: await getEvidence(String(question), aspects, source, model) });
  } catch (e) { return err(e); }
}
