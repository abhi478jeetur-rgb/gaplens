export type Lang = "en" | "hi";
export type DateStatus = "dated" | "undated" | "old";
export interface Source {
  id: string; url?: string; title: string; site: string; date?: string; dateStatus: DateStatus;
  text: string; words: number; years?: string[];
}
export interface Aspect { id: string; label: string; why: string; importance: "high" | "med" | "low" }
export interface Fact {
  id: string; aspectId: string; sourceId: string; statement: string; quote: string; value?: string;
  verified: boolean;
  /** exact = word-for-word in the source; near = at least 85% of its words in one run */
  match?: "exact" | "near" | "none";
}
export type AspectStatus = "covered" | "partial" | "missing" | "conflict";
export interface Conflict { id: string; aspectId: string; factA: string; factB: string; explanation: string; confidence: "high" | "med" | "low" }
export interface Gap { id: string; aspectId: string; why: string; kind: "missing" | "single" }
export interface Outdated { id: string; sourceId: string; reason: string }
export interface VerifyItem { id: string; priority: "high" | "med" | "low"; action: string; why: string; where: string; aspectId?: string }
export interface Report {
  question: string; lang: Lang; createdAt: string;
  sources: Omit<Source, "text">[];
  aspects: (Aspect & { status: AspectStatus; sourceIds: string[] })[];
  matrix: Record<string, Record<string, "covered" | "partial" | "conflict" | "none">>;
  facts: Fact[]; gaps: Gap[]; conflicts: Conflict[]; outdated: Outdated[]; verifyNext: VerifyItem[];
  coverage: number; summary: string;
}
