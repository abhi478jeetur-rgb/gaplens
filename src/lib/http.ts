import { NextResponse } from "next/server";
export function err(e: unknown) {
  const m = e instanceof Error ? e.message : "Something went wrong";
  return NextResponse.json({ error: m === "rate_limited" ? "rate_limited" : m }, { status: m === "rate_limited" ? 429 : 500 });
}
