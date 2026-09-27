import { ML_THRESHOLD, type Report } from "./model";

export type MlState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready" }
  | { status: "unavailable"; reason: string };

export interface Suggestion {
  id: string;
  score: number;
  description: string;
  status: Report["verificationStatus"];
}

type Extractor = (
  text: string,
  opts: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: Float32Array | number[] }>;

let extractor: Extractor | null = null;
const cache = new Map<string, number[]>();

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const den = Math.sqrt(na) * Math.sqrt(nb);
  return den === 0 ? 0 : dot / den;
}

function embedKey(id: string, text: string): string {
  return `${id}:${text.slice(0, 280)}`;
}

export async function loadEmbeddingModel(): Promise<void> {
  const mod = await import("@xenova/transformers");
  extractor = (await mod.pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2",
  )) as Extractor;
}

export async function embedText(id: string, text: string): Promise<number[]> {
  if (!extractor) {
    throw new Error("model not loaded");
  }
  const key = embedKey(id, text);
  const hit = cache.get(key);
  if (hit) return hit;
  const truncated = text.replace(/\s+/g, " ").trim().slice(0, 280);
  const output = await extractor(truncated, { pooling: "mean", normalize: true });
  const vec = Array.from(output.data);
  cache.set(key, vec);
  return vec;
}

export async function relatedReports(
  current: Report,
  all: Report[],
): Promise<Suggestion[]> {
  const currentVec = await embedText(current.id, `${current.riskCategory} ${current.description}`);
  const others = all.filter((r) => r.id !== current.id);
  const scored: Suggestion[] = [];
  for (const other of others) {
    const vec = await embedText(other.id, `${other.riskCategory} ${other.description}`);
    const score = cosine(currentVec, vec);
    if (score >= ML_THRESHOLD) {
      scored.push({
        id: other.id,
        score,
        description: other.description,
        status: other.verificationStatus,
      });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}
