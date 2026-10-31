const URL = "https://api.groq.com/openai/v1/chat/completions";
export const MODELS = { big: "openai/gpt-oss-120b", small: "openai/gpt-oss-20b", alt: "qwen/qwen3.8-27b" } as const;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseJSON(s: string): unknown {
  try { return JSON.parse(s); } catch {}
  const m = s.match(/\{[\s\S]*\}/);
  if (m) return JSON.parse(m[0]);
  throw new Error("Model did not return JSON");
}

export async function chatJSON<T = unknown>(system: string, user: string, opts: { models?: string[]; maxTokens?: number } = {}): Promise<T> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");
  const models = opts.models ?? [MODELS.big, MODELS.small, MODELS.alt];
  let lastErr: unknown;
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model, temperature: 0.1, max_tokens: opts.maxTokens ?? 2500,
          response_format: { type: "json_object" },
          ...(model.startsWith("openai/") ? { reasoning_effort: "low" } : {}),
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
        }),
      });
      if (res.status === 429) {
        const ra = Number(res.headers.get("retry-after") ?? "3");
        lastErr = new Error("rate_limited");
        if (ra > 12) break; // try next model instead of waiting long
        await sleep((ra + 0.5) * 1000);
        continue;
      }
      if (!res.ok) { lastErr = new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`); break; }
      const data = await res.json();
      const content: string = data.choices?.[0]?.message?.content ?? "";
      try { return parseJSON(content) as T; } catch (e) { lastErr = e; }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("LLM failed");
}
