import { z } from "zod";

export const COMMITMENTS = ["Side Project (<10h/wk)", "Part-Time (10-20h/wk)", "Full-Time Co-Founder"] as const;
export const LOCATIONS = ["Remote-Only", "Hybrid", "On-Site"] as const;
export const FEEDBACK = [
  { value: "stack_mismatch", label: "Stack Mismatch" },
  { value: "position_filled", label: "Position Filled" },
  { value: "time_commitment", label: "Time Commitment" },
  { value: "overqualified", label: "Overqualified" },
  { value: "underqualified", label: "Underqualified" },
  { value: "no_response", label: "No Response" },
] as const;
export const alignmentSchema = z.object({
  project_id: z.string().uuid(), equity_range_offered: z.string().trim().min(1).max(80),
  vesting_schedule: z.string().trim().min(1).max(160), time_commitment: z.enum(COMMITMENTS),
  location_preference: z.enum(LOCATIONS), timezone_overlap_min: z.number().int().min(0).max(24),
});
export function equityEstimate(stage: string, funded: boolean, hours: number, expertise: number) {
  const base = stage === "Idea" ? 35 : stage === "Prototype" ? 25 : stage === "Live Revenue" ? 15 : 10;
  const estimate = Math.max(1, Math.min(49, base * Math.min(40, Math.max(1, hours)) / 40 * (0.75 + Math.max(1, Math.min(5, expertise)) * 0.1) * (funded ? 0.7 : 1)));
  return { low: Math.max(1, Math.round(estimate * 0.8)), high: Math.min(49, Math.round(estimate * 1.2)) };
}
export function eligibleInstantApply(status: string | undefined, demo: boolean, pitch: string | null | undefined, role: string | null | undefined) {
  return status === "top_builder" && !demo && (pitch?.trim().length ?? 0) >= 20 && (role?.trim().length ?? 0) >= 2;
}
export function routeQualifies(score: number | null, threshold: number) {
  return score !== null && score > threshold;
}
export function commitmentText(project: string, checks: { vesting: boolean; ip_assignment: boolean; time_commitment: boolean }) {
  return `Slyk co-founder handoff — ${project}\n\n${checks.vesting ? "[x]" : "[ ]"} Vesting schedule reviewed\n${checks.ip_assignment ? "[x]" : "[ ]"} IP assignment reviewed\n${checks.time_commitment ? "[x]" : "[ ]"} Time commitment agreed\n\nDiscussion checklist only; not a binding agreement. Complete legal terms with qualified counsel.\nContinue through Email, Telegram, or Calendly.`;
}