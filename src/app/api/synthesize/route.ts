import { NextResponse } from "next/server";
import { synthesize } from "@/lib/pipeline";
import { err } from "@/lib/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    const { question, lang, aspects, sources, facts } = await req.json();
    return NextResponse.json({ report: await synthesize(String(question), lang === "hi" ? "hi" : "en", aspects, sources, facts) });
  } catch (e) { return err(e); }
}
