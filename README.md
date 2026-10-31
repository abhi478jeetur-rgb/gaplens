# GapLens

**See what your sources don't tell you.** Built for the Shinchan Online Hackathon 2026, problem statement *Digital Dark Spot: AI-Assisted Information Gap Detection Platform*.

Give GapLens a question and 2 to 6 sources (links or pasted text). It returns:

- **Confirmed facts**, each with the exact quote and a link to the page it came from. Quotes are checked against the source text in code; anything the model paraphrased is marked unverified.
- **Dark spots**: parts of a complete answer that no source covers, plus parts only one source mentions.
- **Conflicts**: places where sources disagree, quoted side by side.
- **Outdated or undated** sources.
- A **coverage score and map** (aspect × source), computed deterministically from verified evidence.
- A prioritised **Verify next** checklist.
- English and Hindi output, and Markdown export.

## How it works

1. **Read**: server-side extraction with Mozilla Readability + linkedom. Blocks private/local addresses, 12 s timeout, 2.5 MB cap, paste-text fallback for PDFs and blocked pages.
2. **Plan**: an LLM lists the specific, checkable facts a complete answer needs.
3. **Evidence**: per source, the most relevant passages are selected in code and the LLM extracts facts with verbatim quotes. `verifyQuote` checks every quote against the page.
4. **Synthesise**: the LLM proposes conflicts and gap notes; coverage, status and score are computed in code from verified facts only.

LLM: Groq (`openai/gpt-oss-120b`, fallbacks `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`).

## Run locally

```bash
npm install
echo "GROQ_API_KEY=your_key" > .env.local
npm run dev
```

The scholarship demo (`/demo/*.json`) is a saved run over four real pages read on 31 Oct 2026, so judges can see a full report without waiting on the API.

## Limits

GapLens flags *potential* gaps and conflicts. It is a research aid, not legal or official advice; always confirm on the official source.
