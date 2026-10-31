import { NextResponse } from "next/server";
import { getAspects } from "@/lib/pipeline";
import { err } from "@/lib/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question || String(question).trim().length < 8) return NextResponse.json({ error: "Write a fuller question first." }, { status: 400 });
    return NextResponse.json({ aspects: await getAspects(String(question).slice(0, 500)) });
  } catch (e) { return err(e); }
}
