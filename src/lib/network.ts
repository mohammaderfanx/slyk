import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type Bounty = Database["public"]["Tables"]["project_bounties"]["Row"];
export const WORKSPACE_ROLES = ["admin", "recruiter", "founder", "member"] as const;
export const DURATIONS = ["<5 hrs", "1-2 days", "1-2 weeks"] as const;
export const workspaceSchema = z.object({ name: z.string().trim().min(2).max(100), slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,59}$/) });
export function reciprocalEligible(similarity: number, available: boolean, demo: boolean) {
  return Number.isFinite(similarity) && similarity > 0.90 && similarity <= 1 && available && !demo;
}
export function filterBounties(list: Bounty[], filters: { q: string; minimum: number; currency: string; duration: string }) {
  return list.filter(b => b.status === "open" && b.reward_amount >= filters.minimum && (filters.currency === "all" || b.currency === filters.currency) && (filters.duration === "all" || b.duration === filters.duration) && `${b.title} ${b.tech_stack.join(" ")}`.toLowerCase().includes(filters.q.trim().toLowerCase()));
}
export function bountySignoffComplete(b: Pick<Bounty, "owner_signed_at" | "builder_signed_at">) {
  return !!b.owner_signed_at && !!b.builder_signed_at;
}
export function alignmentComparison(a: { equity_range_offered: string; time_commitment: string; location_preference: string; timezone_overlap_min: number } | undefined, b: typeof a) {
  if (!a || !b) return null;
  return { commitment: a.time_commitment === b.time_commitment, location: a.location_preference === b.location_preference, overlap: Math.max(a.timezone_overlap_min, b.timezone_overlap_min), equityA: a.equity_range_offered, equityB: b.equity_range_offered };
}
export function networkHead(title: string, description: string) {
  return { meta: [{ title: `${title} — Slyk` }, { name: "description", content: description }, { property: "og:title", content: `${title} — Slyk` }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
}