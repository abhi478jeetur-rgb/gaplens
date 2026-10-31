import type { Report } from "./types";
import type { Dict } from "./i18n";
export function toMarkdown(r: Report, d: Dict): string {
  const src = (id: string) => r.sources.find((s) => s.id === id);
  const fact = (id: string) => r.facts.find((f) => f.id === id);
  const asp = (id?: string) => r.aspects.find((a) => a.id === id)?.label ?? "";
  const L: string[] = [];
  L.push(`# GapLens report`, ``, `**Question:** ${r.question}`, ``, `**${d.coverage}:** ${r.coverage}% (${d.lit(r.coverage)})`, ``, r.summary, ``);
  L.push(`## ${d.verify}`); r.verifyNext.forEach((v, i) => L.push(`${i + 1}. [ ] **${d.importance[v.priority]}**: ${v.action}  \n   ${d.why}: ${v.why}. ${d.where}: ${v.where}`)); L.push("");
  L.push(`## ${d.tGaps}`); r.gaps.forEach((g) => L.push(`- **${asp(g.aspectId)}** (${g.kind === "missing" ? d.missingGap : d.singleGap}): ${g.why}`)); L.push("");
  L.push(`## ${d.tConflicts}`); if (!r.conflicts.length) L.push(d.noConflicts);
  r.conflicts.forEach((c) => { const a = fact(c.factA), b = fact(c.factB); L.push(`- **${asp(c.aspectId)}**: ${c.explanation}`, `  - ${src(a!.sourceId)?.site}: "${a?.quote}"`, `  - ${src(b!.sourceId)?.site}: "${b?.quote}"`); }); L.push("");
  L.push(`## ${d.tOutdated}`); if (!r.outdated.length) L.push(d.noOutdated); r.outdated.forEach((o) => L.push(`- ${src(o.sourceId)?.title} (${src(o.sourceId)?.site}): ${o.reason}`)); L.push("");
  L.push(`## ${d.tConfirmed}`);
  for (const a of r.aspects) { const fs = r.facts.filter((f) => f.aspectId === a.id && f.verified); if (!fs.length) continue; L.push(`### ${a.label}`); fs.forEach((f) => L.push(`- ${f.statement}  \n  > "${f.quote}" (${src(f.sourceId)?.site})`)); }
  L.push("", `## ${d.sources}`); r.sources.forEach((s) => L.push(`- ${s.id}: [${s.title}](${s.url ?? ""}) (${s.date ?? d.undated})`));
  L.push("", `_${d.disclaimer}_`, `_Generated ${r.createdAt}_`);
  return L.join("\n");
}

export function toChecklist(r: Report, d: Dict): string {
  const L = [`${d.shareHead} ${r.question}`, `${d.coverage}: ${r.coverage}% (${d.lit(r.coverage)})`, ""];
  r.verifyNext.forEach((v, i) => L.push(`${i + 1}. [${d.importance[v.priority]}] ${v.action} (${d.where}: ${v.where})`));
  L.push("", d.disclaimer, "https://gaplens-nine.vercel.app");
  return L.join("\n");
}
