import type { Database } from "@/integrations/supabase/types";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export const CATEGORIES = ["AI/ML", "SaaS", "DevTools", "Web3"] as const;
export const STAGES = ["Idea", "Prototype", "Live Revenue", "Funded"] as const;
export const ENTITIES = ["Solo Founder", "Early Team", "Company"] as const;
export const INCENTIVES = ["Equity", "Paid", "Equity + Paid", "Open Source"] as const;
export const PROFILE_COLS = "id, full_name, avatar_url, primary_link";

export const projectsQuery = {
  queryKey: ["projects"],
};

export function filterProjects(
  list: Project[],
  f: { q: string; category: string; stage: string; incentive: string },
) {
  const q = f.q.trim().toLowerCase();
  return list.filter((p) => {
    if (f.category !== "all" && p.category !== f.category) return false;
    if (f.stage !== "all" && p.stage !== f.stage) return false;
    if (f.incentive !== "all" && p.incentive !== f.incentive) return false;
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.tech_stack.some((t) => t.toLowerCase().includes(q))
    );
  });
}
