import { NextResponse } from "next/server";
import { extractUrl, fromPastedText } from "@/lib/extract";
import { limit, CAPS, tooBig } from "@/lib/guard";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(req: Request) {
  const blocked = limit(req, "extract", 30); if (blocked) return blocked;
  try {
    const { url, text, title, id } = await req.json();
    if (text && String(text).length > CAPS.pasteChars) return tooBig("Pasted text is too long (max 60,000 characters).");
    const src = text ? fromPastedText(String(text), String(title ?? ""), String(id ?? "s1")) : await extractUrl(String(url), String(id ?? "s1"));
    return NextResponse.json({ source: src });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't read this page." }, { status: 422 });
  }
}
