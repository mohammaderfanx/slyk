import { describe, expect, it } from "vitest";
import { filterProjects, type Project } from "@/lib/slyk";

const p = (o: Partial<Project>): Project => ({
  id: "1", created_at: "", user_id: null, title: "Alpha", tagline: "", category: "AI/ML", stage: "Idea",
  entity_type: "Solo Founder", looking_for: "", incentive: "Equity", tech_stack: [], ...o,
});
const all = { q: "", category: "all", stage: "all", incentive: "all" };

describe("filterProjects", () => {
  it("search matches tech stack", () => {
    expect(filterProjects([p({ tech_stack: ["PyTorch"] }), p({ id: "2" })], { ...all, q: "pytorch" })).toHaveLength(1);
  });
  it("filters by category", () => {
    expect(filterProjects([p({}), p({ id: "2", category: "SaaS" })], { ...all, category: "SaaS" })[0]?.id).toBe("2");
  });
});
