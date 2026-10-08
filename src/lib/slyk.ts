import type { Database } from "@/integrations/supabase/types";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export const CATEGORIES = ["AI/ML", "SaaS", "DevTools", "Web3"] as const;
export const STAGES = ["Idea", "Prototype", "Live Revenue", "Funded"] as const;
export const ENTITIES = ["Solo Founder", "Early Team", "Company"] as const;
export const INCENTIVES = ["Equity", "Paid", "Equity + Paid", "Open Source"] as const;
export const SORTS = ["recent", "match", "comp"] as const;
export type Sort = (typeof SORTS)[number];
// Never include direct_contact here — it is not granted to clients.
export const PROFILE_COLS = "id, full_name, avatar_url, primary_link, skills, github_handle, github_stats, verification_status, reputation_score";

export type FeedFilters = { q: string; category: string; stage: string; incentive: string };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#]/g, "");

/** Subsequence fuzzy match: every char of needle appears in order in hay. */
export function fuzzy(hay: string, needle: string) {
  const h = norm(hay), n = norm(needle);
  if (!n) return true;
  if (h.includes(n)) return true;
  let i = 0;
  for (const c of h) if (c === n[i] && ++i === n.length) return true;
  return false;
}

export function filterProjects(list: Project[], f: FeedFilters) {
  const terms = f.q.trim().split(/\s+/).filter(Boolean);
  return list.filter((p) => {
    if (f.category !== "all" && p.category !== f.category) return false;
    if (f.stage !== "all" && p.stage !== f.stage) return false;
    if (f.incentive !== "all" && p.incentive !== f.incentive) return false;
    const fields = [p.title, p.tagline, p.looking_for, ...p.tech_stack];
    return terms.every((t) => fields.some((x) => fuzzy(x, t)));
  });
}

/** % of project's tech stack + role keywords covered by the user's skills. */
export function matchScore(skills: string[], p: Project): number | null {
  if (!skills.length) return null;
  const mine = skills.map(norm).filter(Boolean);
  const stack = p.tech_stack.map(norm).filter(Boolean);
  const stackHits = stack.filter((t) => mine.some((m) => m === t || t.includes(m) || m.includes(t))).length;
  const role = norm(p.looking_for);
  const roleHit = mine.some((m) => m.length >= 2 && role.includes(m)) ? 1 : 0;
  const total = stack.length + 1;
  return Math.round(((stackHits + roleHit) / total) * 100);
}

const COMP_RANK: Record<string, number> = { "Equity + Paid": 3, Paid: 2, Equity: 1, "Open Source": 0 };

export function sortProjects(list: Project[], sort: Sort, skills: string[]) {
  const out = [...list];
  if (sort === "match") out.sort((a, b) => (matchScore(skills, b) ?? 0) - (matchScore(skills, a) ?? 0));
  else if (sort === "comp") out.sort((a, b) => (COMP_RANK[b.incentive] ?? 0) - (COMP_RANK[a.incentive] ?? 0));
  else out.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return out;
}

export type Launcher = { kind: "email" | "telegram" | "calendly" | "link"; label: string; href: string };

/** Turns a free-form contact into a one-click launcher with a pre-filled message. */
export function contactLauncher(contact: string | null | undefined, name: string, projectTitle: string): Launcher | null {
  const c = (contact ?? "").trim();
  if (!c) return null;
  const msg = `Hey ${name}, I accepted your Slyk pitch for ${projectTitle}! Let's talk.`;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c))
    return { kind: "email", label: "Send Email", href: `mailto:${c}?subject=${encodeURIComponent(`Slyk: ${projectTitle}`)}&body=${encodeURIComponent(msg)}` };
  if (/calendly\.com/i.test(c)) return { kind: "calendly", label: "Book Calendly", href: c.startsWith("http") ? c : `https://${c}` };
  const tg = c.match(/^(?:@|https?:\/\/t\.me\/|t\.me\/)([A-Za-z0-9_]{4,})$/);
  if (tg) return { kind: "telegram", label: "Open Telegram", href: `https://t.me/${tg[1]}?text=${encodeURIComponent(msg)}` };
  if (/^https?:\/\//.test(c)) return { kind: "link", label: "Open Link", href: c };
  return null;
}

export type Proof = Database["public"]["Tables"]["project_proofs"]["Row"];
export const PROOF_TYPES = ["github_repo", "demo_video", "live_metrics", "deck_url"] as const;
export const PROOF_LABELS: Record<string, string> = {
  github_repo: "GitHub repo", demo_video: "Demo video", live_metrics: "Live metrics", deck_url: "Deck",
};

/** Trust badges derived from verified proofs. */
export function trustBadges(proofs: Pick<Proof, "proof_type" | "verified">[]) {
  const out: string[] = [];
  if (proofs.some((p) => p.verified && p.proof_type === "github_repo")) out.push("Verified Codebase");
  if (proofs.some((p) => p.verified && p.proof_type === "live_metrics")) out.push("Verified Live Product");
  return out;
}

/** 0-100 quality score for a pitch: length sweet spot, stack relevance, proof link. */
export function pitchQuality(pitch: string, project: Pick<Project, "tech_stack" | "looking_for">, hasLink: boolean) {
  const len = pitch.trim().length;
  let s = 0;
  s += len < 30 ? 10 : len <= 220 ? 40 : 25;
  const text = norm(pitch);
  const terms = [...project.tech_stack, ...project.looking_for.split(/\s+/)].map(norm).filter((t) => t.length > 2);
  const hits = new Set(terms.filter((t) => text.includes(t))).size;
  s += Math.min(hits, 3) * 12;
  if (/\d/.test(pitch)) s += 12; // concrete numbers
  if (hasLink) s += 12;
  return Math.min(100, s);
}

/** Applicant ranking: match + reputation + pitch quality. */
export function applicantRank(match: number, reputation: number, quality: number) {
  return Math.round(match * 0.45 + Math.min(reputation, 400) / 4 * 0.3 + quality * 0.25);
}

/** Returns an embeddable URL for YouTube or Loom links. */
export function videoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const loom = url.match(/loom\.com\/share\/([\w-]+)/);
  if (loom) return `https://www.loom.com/embed/${loom[1]}`;
  return null;
}

export function githubRepoPath(url: string): string | null {
  const m = url.match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/?$/);
  return m ? `${m[1]}/${m[2]}` : null;
}
