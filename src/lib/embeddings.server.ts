// Server-only: embeds project / profile text via Lovable AI Gateway.
export const EMBED_MODEL = "openai/text-embedding-3-small"; // 1536 dims, requested in the Phase 3 brief

export function projectText(p: { title: string; tagline: string; looking_for: string; tech_stack: string[]; category: string }) {
  return `Project: ${p.title}. Category: ${p.category}. Looking for: ${p.looking_for}. Tech stack: ${p.tech_stack.join(", ")}. ${p.tagline}`;
}

export function profileText(p: { skills: string[]; github_stats: unknown }) {
  const langs = (p.github_stats as { primary_languages?: string[] } | null)?.primary_languages ?? [];
  return `Builder skills: ${p.skills.join(", ")}.${langs.length ? ` Primary languages: ${langs.join(", ")}.` : ""}`;
}

export async function hashText(t: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class GatewayError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Embeds up to 32 texts in one request; returns vectors in input order. */
export async function embed(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new GatewayError(401, "AI is not configured for this project.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts.slice(0, 32) }),
  });
  if (!res.ok) {
    const body = await res.text();
    const msg = res.status === 402 ? "AI credits are used up — semantic matching paused." : res.status === 429 ? "AI is busy, try again shortly." : `AI matching failed (${res.status}).`;
    console.error(`Embeddings failed [${res.status}]: ${body}`);
    throw new GatewayError(res.status, msg);
  }
  const json = (await res.json()) as { data: { index: number; embedding: number[] }[] };
  const out: number[][] = [];
  for (const d of json.data) out[d.index] = d.embedding;
  if (out.length !== Math.min(texts.length, 32) || out.some((v) => !v?.length)) throw new GatewayError(500, "Invalid embedding response");
  return out;
}

export const toPgVector = (v: number[]) => `[${v.join(",")}]`;
