import { NextResponse } from "next/server";
import { extractUrl, fromPastedText } from "@/lib/extract";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(req: Request) {
  try {
    const { url, text, title, id } = await req.json();
    const src = text ? fromPastedText(String(text), String(title ?? ""), String(id ?? "s1")) : await extractUrl(String(url), String(id ?? "s1"));
    return NextResponse.json({ source: src });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't read this page." }, { status: 422 });
  }
}
